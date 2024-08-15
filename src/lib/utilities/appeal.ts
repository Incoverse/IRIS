import chalk from "chalk";
import { Client } from "discord.js";
import crypto from "crypto";
import { IRISGlobal } from "@src/interfaces/global.js";

declare const global: IRISGlobal

const connectionURL = global.app.config.development ? "ws://api.localhost:3000/ws/appeal/bot/" : "wss://api.inimicalpart.com/ws/appeal/bot/";

export default class ICOMAppealSystem {
    public UUID: string;
    public ws: WebSocket;
    private debug: boolean;
    private verificationKey: string;

    private ready = false;

    constructor(UUID: string, verificationKey: string, debug = false) {
        this.UUID = UUID;
        this.debug = debug;
        this.verificationKey = verificationKey;

        if (this.debug) console.log(`[APPEAL] Attempting to connect to appeal system with UUID ${UUID}`);
        this.ws = new WebSocket(`${connectionURL}${UUID}`);
        this.ws.onopen = this.onWebsocketConnected.bind(this);
        this.ws.onerror = (ev: Event) => {
            this.onClose();
        }
    }

    private setupReconnect() {
        this.ws.onclose = (ev: CloseEvent) => {
            this.onClose(ev);
        }
    }

    private onClose(ev?) {
        this.ready = false;
        if ([1000, 3008].includes(ev?.code)) {
            if (ev.reason && this.debug) console.log(`[APPEAL] Connection closed by server:`, chalk.redBright(ev?.reason));
            return
        };
        if (this.debug) console.log(`[APPEAL] Connection closed or unable to connect, attempting to reconnect in 30s...`);
        sleep(30000).then(() => {
            this.ws = new WebSocket(`${connectionURL}${this.UUID}`);
            this.ws.onopen = this.onWebsocketConnected.bind(this);
            this.ws.onerror = (ev: Event) => {
                this.onClose();
            }
        });
    }

    private onWebsocketConnected() {
        //! Binding all the functions to respective WebSocket communication events
        this.ws.onmessage = async (ev: MessageEvent) => {
            let data: {
                type: string;
                [key: string]: any;
            } = null;
            try {
                data = JSON.parse(ev.data);
            } catch (e) {
                console.error(`[APPEAL] Error parsing message:`, e);
            }
            if (this.debug) console.log(`[APPEAL] Received message:`, data);

            //! Verification
            if (data.type === "verification") {
                this.ws.send(JSON.stringify({
                    type: "verification",
                    response: this.encryptChallengeCode(data.challengeCode, this.verificationKey)
                }));
                return;
            } else if (data.type === "connected") {
                this.ready = true;
                if (this.debug) console.log(`[APPEAL] Connected to appeal system with UUID ${this.UUID}`);
                return;
            } else if (!this.ready) {
                console.error(`[APPEAL] Received message before verification:`, data);
                return;
            } else if (data.type === "error") {
                console.error(`[APPEAL] Error:`, data);
                return;
            } else if (data.type === "query") {
                if (data.query === "bot-info") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, []);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onBotInfoQuery?.call(this) }));
                }  else if (data.query === "server-info") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, []);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onServerInfoQuery?.call(this) }));
                } else if (data.query === "offenses") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onOffensesQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "offense") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}, {name:"admin", type:"boolean", optional: true}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onOffenseQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "involvedUsers") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}, {name:"admin", type:"boolean", optional: true}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onGetInvolvedUsersQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "appeal") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onGetAppealQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "admin") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onCheckAdminQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "usersWithOffenses") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, []);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onGetUsersWithOffensesQuery?.call(this) }));
                } else if (data.query === "user") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onGetUserQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "usersOffenses") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onGetUsersOffensesQuery?.call(this, data.data ?? {}) }));
                } else if (data.query === "member") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));

                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onCheckMemberQuery?.call(this, data.data ?? {}) }));
                }

            } else if (data.type === "request") {
                if (data.request === "save-email") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"email", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onSaveEmailRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "create-appeal") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}, {name:"message", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onCreateAppealRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "send-message") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}, {name:"message", type:"string"}, {name:"admin", type:"boolean", optional: true}, {name:"send_as", type:"string", optional: true}, {name:"anonymous", type:"boolean", optional: true}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onSendMessageRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "toggle-appealment") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"user_id", type:"string"}, {name:"offense_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onToggleAppealmentRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "revoke-offense") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"closer_id", type:"string"}, {name:"offense_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onRevokeOffenseRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "approve-appeal") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"closer_id", type:"string"}, {name:"offense_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onApproveAppealRequest?.call(this, data.data ?? {}) }));
                } else if (data.request === "deny-appeal") {
                    const parametersAreValid = this.validateParameters(data.data ?? {}, [{name:"closer_id", type:"string"}, {name:"offense_id", type:"string"}]);
                    if (!parametersAreValid.success) return this.ws.send(JSON.stringify({ type: "error", for: data.type, nonce: data.nonce, error: parametersAreValid.error }));
                    
                    return this.ws.send(JSON.stringify({ type: data.type, nonce: data.nonce, result: await this.onDenyAppealRequest?.call(this, data.data ?? {}) }));
                }
            }
        }
        // Make a reconnection attempt if the connection drops, but wasnt closed by the client on purpose
        this.setupReconnect();
    }

    private validateParameters(data: any, required: {name: string, type?: string, optional?: boolean}[]) {
        for (const param of required) {
            if (!data[param.name] && !param.optional) return { success: false, error: `Missing parameter: ${param.name}` };
            if (data[param.name] && param.type && typeof data[param.name] !== param.type) return { success: false, error: `Invalid parameter type for ${param.name}, expected ${param.type}` };
        }
        for (const key in data) {
            if (!required.find(r => r.name === key)) return { success: false, error: `Unexpected parameter: ${key}` };
        }
        return { success: true };
    }

    public onBotInfoQuery: ((this: ICOMAppealSystem) => any) | null;
    public onServerInfoQuery: ((this: ICOMAppealSystem) => any) | null;
    public onOffensesQuery: ((this: ICOMAppealSystem, data: {user_id: string}) => any) | null;
    public onSaveEmailRequest: ((this: ICOMAppealSystem, data: {user_id: string, email: string}) => any) | null;
    public onOffenseQuery: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string, admin?: boolean}) => any) | null; //! ADMIN REQUIRED (admin)
    public onGetInvolvedUsersQuery: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string, admin?: boolean}) => any) | null; //! ADMIN REQUIRED (admin)
    public onCreateAppealRequest: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string, message: string}) => any) | null;
    public onGetAppealQuery: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string}) => any) | null;
    public onSendMessageRequest: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string, message: string, admin?: boolean, send_as?: string, anonymous?: boolean}) => any) | null; //! ADMIN REQUIRED (admin, send_as)
    public onCheckAdminQuery: ((this: ICOMAppealSystem, data: {user_id: string}) => any) | null;
    public onGetUsersWithOffensesQuery: ((this: ICOMAppealSystem) => any) | null; //! ADMIN REQUIRED
    public onGetUserQuery: ((this: ICOMAppealSystem, data: {user_id: string}) => any) | null; //! ADMIN REQUIRED
    public onGetUsersOffensesQuery: ((this: ICOMAppealSystem, data: {user_id: string}) => any) | null; //! ADMIN REQUIRED
    public onToggleAppealmentRequest: ((this: ICOMAppealSystem, data: {user_id: string, offense_id: string}) => any) | null; //! ADMIN REQUIRED
    public onRevokeOffenseRequest: ((this: ICOMAppealSystem, data: {closer_id: string, offense_id: string}) => any) | null; //! ADMIN REQUIRED
    public onApproveAppealRequest: ((this: ICOMAppealSystem, data: {closer_id: string, offense_id: string}) => any) | null; //! ADMIN REQUIRED
    public onDenyAppealRequest: ((this: ICOMAppealSystem, data: {closer_id: string, offense_id: string}) => any) | null; //! ADMIN REQUIRED
    public onCheckMemberQuery: ((this: ICOMAppealSystem, data: {user_id: string}) => any) | null; //! Check if a user is or has been a member of the guild



    public checks = {
        emailValidity: function (email: string): boolean {
            return !!email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
        },
        messageValidity: function (message: string): boolean {
            return !!message && message.length > 0 && message.length <= 2000
        },
        appealable: function (offense: any): boolean {
            return !!offense.status && offense.status === "ACTIVE" && !["DENIED", "APPROVED"].includes(offense?.appeal?.status) && offense.can_appeal
        },
        offenseExists: function (offense: any, appealer?: string): boolean {
            return !!offense && (!appealer || offense.user_id === appealer)
        },
        isAppealed: function (offense: any): boolean {
            return !!offense?.appeal
        }
    }

    private encryptChallengeCode(challengeCode: string, privateKey: string): string {
        return crypto.privateEncrypt(privateKey, Buffer.from(challengeCode)).toString('base64');
    }
    
}



function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}