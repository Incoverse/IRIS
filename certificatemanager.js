//! Use multithreading to call this file from index.js

//! This file will be checking and replacing the certificate by calling out to process.env.cert to get the new certificate and check the expiry date using process.env.certexpiry
//! After a successful replace, it's gonna restart mongodb while also queueing database operations running from the index file until the replacement is complete
