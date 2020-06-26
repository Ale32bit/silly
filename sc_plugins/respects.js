/*
    Respects Bot Plugin for SwitchChat Bot

    Copyright (c) 2019 Alessandro "Ale32bit"
*/

const yes = { // this is asking for troubles
        "424ac92b-9b6a-47fd-b47d-2f6742fe615d": "yes",
        "1047f29b-3af3-42ed-964b-52068e9bbf0c": "§c-0§o?!?",
        "a314c2c4-afb6-4db0-b10c-b6f1be4cd05d": "§di am number one",
        "0a802cf4-a2b2-4d00-a48f-ce854bae964a": "chicken^chicken",
}

const { BotPlugin, utils } = require("switchchat");
const fs = require("fs");
const path = require("path");
class Respects extends BotPlugin {
    constructor(client){
        super(client, "me.ale32bit.respects", {

        });

        if(!fs.existsSync(this.configPath)){
            fs.mkdirSync(this.configPath);
        }

        if(!fs.existsSync(path.resolve(this.configPath, "players.json"))){
            fs.writeFileSync(path.resolve(this.configPath, "players.json"), "{}");
        }

        this.respects = require(path.resolve(this.configPath, "players.json"));
        this.cache = require(path.resolve(require.main.path, "cache.json"));

        function cc(m) {
            return m.replace(/&/g, "§")
        }

        let save = () => {
            fs.writeFileSync(path.resolve(this.configPath, "players.json"), JSON.stringify(this.respects));
        };

        this.lastDeath = null;
        this.alreadyPaid = [];
        this.triggerRegex = /^[f]$/i;

        client.on("death", (death) => {
            console.log(death.message);
            this.lastDeath = death.player;
            this.alreadyPaid = [];
        });

        client.on("chat", (message) => {
            if (this.triggerRegex.test(message)) {
                if (this.lastDeath) {
                    if (utils.inArray(this.alreadyPaid, message.player.username)) {
                        message.player.tell(cc(`&cYou already paid respects!`), "Respects", "format");
                        return
                    }
                    if (this.lastDeath.name === message.player.name) {
                        message.player.tell(cc(`&cYou cannot respect yourself >:C`), "Respects", "format");
                        return
                    }
                    this.alreadyPaid.push(message.player.username);
                    if (!this.respects[this.lastDeath.uuid]) this.respects[this.lastDeath.uuid] = 0;
                    this.respects[this.lastDeath.uuid]++;
                    save();
                    this.lastDeath.tell(cc(`&a${message.player} &6paid you respects!`), "Respects", "format");
                    message.player.tell(cc(`&6You paid &a${this.lastDeath} &6respects!`), "Respects", "format");
                }
            }
        });

        this.addCommand("respects", async command => {
            if(command.args[1] === "top") {
                let sortable = [];
                for(let k in this.respects) {
                    sortable.push([
                        k,
                        this.respects[k],
                    ])
                }
                sortable.sort((a, b) => (b[1] - a[1]));
                let msg = cc("&6-- &aTop 10 most respected players &6--");
                for(let i = 0; i<10; i++) {
                    if(sortable[i]) {
                        let player = await this.client.getPlayer(sortable[i][0]);
                        let username;
                        if (player) {
                            username= player.name;
                        } else {
                            username = this.cache[sortable[i][0]]
                        }
                        msg += cc(`\n&b${i+1}. &6${username || sortable[i][0]}&7: &a${yes[sortable[i][0]] ? yes[sortable[i][0]] : sortable[i][1]}`); // and make it double ;-;
                    }
                }
                await command.player.tell(cc(msg), "Respects", "format");
            } else {
                if (!this.respects[command.player.uuid]) this.respects[command.player.uuid] = 0;
                command.player.tell(cc(`&6You have &7${this.respects[command.player.uuid]} &6respects!`), "Respects", "format");
            }
        });
    }
}

module.exports = Respects;
