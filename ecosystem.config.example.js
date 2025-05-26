module.exports = {
    apps: [
        {
            name: "discord-bot",
            script: "./index.js",
            exec_mode: "fork",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "300M",
            log_data_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "logs/err.log",
            out_file: "logs/out.log",
            combine_logs: false,
        },
    ],
};
