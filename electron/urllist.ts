// -Dminecraft.api.env=custom 
// -Dminecraft.api.auth.host=https://auth.agusha.club/auth 
// -Dminecraft.api.account.host=https://auth.agusha.club/account 
// -Dminecraft.api.session.host=https://auth.agusha.club/session 
// -Dminecraft.api.services.host=https://auth.agusha.club/services

export default {
    auth: {
        env: "custom",
        authHost: "https://auth.agusha.club/auth",
        accountHost: "https://auth.agusha.club/account",
        sessionHost: "https://auth.agusha.club/session",
        servicesHost: "https://auth.agusha.club/services",
    },
    registerLink: "https://auth.agusha.club/web/registration",
    launcherHost: "http://localhost:3000/"
}