module.exports = {
    apps: [{
        name: "natours",
        script: "./server.js",
        instances: "2",
        exec_mode: "cluster"
    }]
}