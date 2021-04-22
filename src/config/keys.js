module.exports = {
    port: process.env.PORT || 5000,
    database: {
        url: process.env.MONGO_URI
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        tokenLife: '7d'
    },
    googleapis: {
        CLIENT_ID: "1074375836033-k38tq2e4qcgnh8lls44d6oc0ehmbslku.apps.googleusercontent.com",
        CLIENT_SECRET: "hxCFoCMpT4KaNsongclzt6gg",
        REDIRECT_URI: "https://developers.google.com/oauthplayground",
        REFRESH_TOKEN: "1//04E13S0-qAi7iCgYIARAAGAQSNwF-L9Iru62Eluga5dl2p-B8aohXs4S7i64Xn8aQ0JvjHeGaoJ7Sfs5bFgFGCL3rW6cEC0QnpG8"

    },
    aws: {
        secretKey: "VfaGrhprt5YwrrjF/kU0Ehr2QkdzG5EHvQYWOSN4",
        accessKey: "AKIAYDX3CKBH2CMWPNVB"
    }
}