const fs = require('fs');
var senders = [];
var inited = false;

const filename = "./data.txt"

const initDatabase = () => new Promise(async resolve => {
    if (inited) return resolve(true);
    inited = true;
    try {
        await fs.promises.access(filename, fs.constants.F_OK);
        senders = JSON.parse(await fs.promises.readFile(filename));
        resolve(true);
    } catch (err) {
        await fs.promises.writeFile(filename, '[]');
        resolve(true);
    }
})

const getSenders = async () => {
    await initDatabase();
    return { ok: true, senders };
}

const addSender = async ({ country, firebase_token, sim_name }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].country == country) {
            return { ok: false }
        }
        if (senders[i].firebase_token == firebase_token && senders[i].sim_name == sim_name) {
            senders[i].country = country;
            saveDatabase();
            return { ok: true };
        }
    }
    senders.push({ country, firebase_token, sim_name });
    saveDatabase();
    return { ok: true };

}
const removeSender = async ({ country }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].country == country) {
            senders.splice(i, 1);
            saveDatabase();
            return { ok: true }
        }
    }
    return { ok: false };

}
const getSenderForCountry = (iso2) => {
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].country.toLowerCase() == iso2) {
            return { ok: true, sender: senders[i] };
        }
    }
    return { ok: false }
}

const saveDatabase = async () => {
    await initDatabase();
    await fs.promises.writeFile(filename, JSON.stringify(senders));
}


module.exports = { getSenders, addSender, removeSender, getSenderForCountry }