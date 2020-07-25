/*
    Respects Bot v2 by AlexDevs
    The only good respects bot

    Copyright (c) 2020 AlexDevs

    Press F to pay respects
 */

const path = require("path");
const fs = require("fs");

// Only validates is a message only contains f or F
const payRegex = /^f$/i;
let lastDeath = null;
let players = {};
let respecters = [];

// Players that can run the "update" command
let op = [
    "424ac92b-9b6a-47fd-b47d-2f6742fe615d", // AlexDevs
];

// Convert & to section sign, useful for players
function c(str) {
    return str.replace(/&/g, "§").replace(/§§/g, "&");
}


function save() {
    fs.writeFile(path.resolve(__dirname, "respects.json"), JSON.stringify(players, null, 4), err => console.error);
}

// Create a new player object if non existent
function newPlayer(user) {
    if (!players[user.uuid]) {
        players[user.uuid] = {
            name: user.name, // Username saved as cache
            respects: 0,
            deaths: 0,
            given: 0,
            custom: undefined, // Custom message to display in top 10 leaderboard
        }
    }

    save();
}

// Search a player by name
function getPlayer(name) {
    for (let uuid in players) {
        if (players[uuid].name === name) return players[uuid];
    }
}

// Chatbox sub commands
const commands = {
    top: function (command) { // Display top 10 respected players
        let message = c("&6--- &aTop 10 Leaderboard &6---");

        let sortable = [];
        for (let k in players) {
            sortable.push([
                k,
                players[k].respects,
            ])
        }

        sortable.sort((a, b) => b[1] - a[1]);

        for (let i = 0; i < 10; i++) {
            if (sortable[i]) {
                let player = players[sortable[i][0]];
                message += c(`\n&b${i + 1}. &6${player.name}&7: &a${player.custom ? player.custom.replace(/{}/g, player.respects) : player.respects}`)
            }
        }

        command.user.tell(message, c("&6Respects"), undefined, "format");
    },
    deaths: function (command) { // Display top 10 players who died the most times
        let message = c("&6--- &aTop 10 Deaths Leaderboard &6---");

        let sortable = [];
        for (let k in players) {
            sortable.push([
                k,
                players[k].deaths,
            ])
        }

        sortable.sort((a, b) => b[1] - a[1]);

        for (let i = 0; i < 10; i++) {
            if (sortable[i]) {
                let player = players[sortable[i][0]];
                message += c(`\n&b${i + 1}. &6${player.name}&7: &a${player.deaths}`)
            }
        }

        command.user.tell(message, c("&6Respects"), undefined, "format");
    },
    view: function (command) { // View more information about a player

        // If an argument is passed, use it to look for a player.
        let player = command.args.shift();
        if (player) {
            player = getPlayer(player);
        } else { // View yourself if no argument instead
            player = players[command.user.uuid];
        }

        if (!player) {
            command.user.tell(c("&cPlayer not found!"), c("&6Respects"));
            return;
        }

        let message = c(
            `&6--- &a${player.name} &6---\n` +
            `&6Respects received&7: &a${player.respects}\n` +
            `&6Respects paid&7: &a${player.given}\n` +
            `&6Deaths&7: &a${player.deaths}\n` +
            `&6Custom counter message&7: &a${player.custom ? player.custom : "*None*"}` +
            `${player.custom ? `\n&6Preview&7: &a${player.custom.replace(/{}/g, player.respects)}` : ""}` // Preview
        )

        command.user.tell(message, c("&6Respects"), undefined, "format");
    },
    set: function (command) { // Set custom counter message
        let custom = command.args.join(" ");
        if (custom.trim() === "") { // If no arguments passed, reset the custom message
            players[command.user.uuid].custom = undefined;
            save();
            command.user.tell(c(`&6Custom counter message reset.`), c("&6Respects"));
        } else {
            custom = custom.replace(/\n/gi, "").substr(0, 64);
            players[command.user.uuid].custom = custom;
            save();
            command.user.tell(c(`&6Custom counter message set to &a${custom}\n&6Preview: &a${custom.replace(/{}/g, players[command.user.uuid].respects)}`), c("&6Respects"), undefined, "format");
        }

    },
    help: function (command) {
        let message = c(
            "&6--- &aCommands list &6---\n" +
            "&6top&7: &aShow leaderboard of top 10 respected players\n" +
            "&6deaths&7: &aShow leaderboard of top 10 death counts\n" +
            "&6view&7 [name]: &aView information about a player\n" +
            "&6set&7 [custom counter message]: &aSet custom counter message (&7{}&a is counter placeholder)\n" +
            "&6help&7: &aShow the commands list"
        );

        command.user.tell(message, c("&6Respects"));
    },
    update: function (command) { // OP command to overwrite data
        if (!op.includes(command.user.uuid)) return;

        let cmd = command.args.shift();

        if (!cmd) {
            command.user.tell("Usage: update <field> <name> <...>")
            return;
        }

        let user = getPlayer(command.args.shift());
        if (!user) {
            command.user.tell("User not found");
            return;
        }

        switch (cmd) {
            case "deaths":
                let deaths = parseInt(command.args.shift());
                user.deaths = deaths;
                save();
                break;
            case "given":
                let given = parseInt(command.args.shift());
                user.given = given;
                save();
                break;
            case "respects":
                let respects = parseInt(command.args.shift());
                user.respects = respects;
                save();
                break;
            case "custom":
                let custom = command.args.join(" ");
                user.custom = custom.trim() === "" ? undefined : custom;
                save();
                break;
            default:
                command.user.tell("Options: deaths, given, respects, custom")
                return;
        }
    }
};

function plugin(client) {
    client.on("command", command => { // run sub command
        let prefix = command.command.toLowerCase();
        if (prefix !== "respects" && prefix !== "f") return;

        newPlayer(command.user);

        let cmd = command.args.shift();

        if (command.args.length === 0 && !commands[cmd]) {
            commands.help(command);
            return;
        }

        commands[cmd](command);
    })

    client.on("chat", message => {
        if (payRegex.test(message.text)) { // a player said "f"
            if (!lastDeath) {
                message.user.tell(c("*&7No one died since my last restart.*"), c("&6Respects"))
                return;
            }

            if (lastDeath === message.user.uuid) { // Avoid paying respects to yourself
                message.user.tell(c(`&cYou cannot respect yourself >:(`), c("&6Respects"))
                return;
            }

            if (respecters.includes(message.user.uuid)) { // Avoid paying respects again
                message.user.tell(c(`&cYou already paid respects to &6${players[lastDeath].name || "Steve"}`), c("&6Respects"))
                return;
            }

            players[lastDeath].respects++;
            players[message.user.uuid].given++;
            respecters.push(message.user.uuid);
            save();

            client.tell(players[lastDeath].name, c(`&6${message.user.name} &apaid you respects!`), c("&6Respects"));
            message.user.tell(c(`&aYou paid respects to &6${players[lastDeath].name}`), c("&6Respects"));
        }
    })

    client.on("death", death => { // increase death counter
        console.log(death.user.name, "has died")
        newPlayer(death.user); // failsafe in case the bot wasn't running when a new player joined

        players[death.user.uuid].deaths++;
        save();
        respecters = [];
        lastDeath = death.user.uuid;
    })

    client.on("join", user => { // update cached name
        newPlayer(user);

        if (players[user.uuid].name !== user.name) {
            players[user.uuid].name = user.name;
            save();
        }
    })
}

if (!fs.existsSync(path.resolve(__dirname, "respects.json"))) {
    fs.writeFileSync(path.resolve(__dirname, "respects.json"), "{}");
}

players = JSON.parse(fs.readFileSync(path.resolve(__dirname, "respects.json")).toString());

module.exports = plugin
