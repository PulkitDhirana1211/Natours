module.exports = {
    apps: [{
        name: "natours",
        script: "./server.js", // <-- Make sure this matches your main file
        instances: "max",
        exec_mode: "cluster"
    }]
}