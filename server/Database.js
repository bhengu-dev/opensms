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
    let maxid = 0;
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].country == country && senders[i].firebase_token == firebase_token && senders[i].sim_name == sim_name) {
            return { ok: false }
        }
        if (senders[i].id > maxid) {
            maxid = senders[i].id;
        }
    }
    const sender = { id: maxid + 1, country, firebase_token, sim_name, worldwide: false, safety: false, load: 0, last_sent: Date.now() };
    senders.push(sender);
    await saveDatabase();
    return { ok: true, sender };
}

const updateSenderWorldwide = async ({ id, worldwide }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].id == id) {
            senders[i].worldwide = worldwide;
            await saveDatabase();
            return { ok: true };
        }
    }
    return { ok: false };
}

const updateSenderSafety = async ({ id, safety }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].id == id) {
            senders[i].safety = safety;
            await saveDatabase();
            return { ok: true };
        }
    }
    return { ok: false };
}


const updateSenderLastSent = async ({ id, last_sent }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].id == id) {
            senders[i].last_sent = last_sent;
            senders[i].load++;
            await saveDatabase();
            return { ok: true };
        }
    }
    return { ok: false };
}

const removeSender = async ({ id }) => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].id == id) {
            senders.splice(i, 1);
            await saveDatabase();
            return { ok: true }
        }
    }
    return { ok: false };

}
const getOptimalSender = async (iso2) => {
    await initDatabase();
    let c_id = 0, w_id = 0
    for (let i = 0; i < senders.length; i++) {
        if (senders[i].country.toLowerCase() == iso2.toLowerCase()) {
            if (!c_id || (senders[i].load < senders[c_id - 1].load)) {
                c_id = i + 1;
            }
        }
        else if (senders[i].worldwide) {
            if (!w_id || (senders[i].load < senders[w_id - 1].load)) {
                w_id = i + 1;
            }
        }
    }
    if (!c_id && !w_id)
        return false;

    const index = c_id ? (c_id - 1) : (w_id - 1);
    return senders[index];
}

const saveDatabase = async () => {
    await initDatabase();
    await fs.promises.writeFile(filename, JSON.stringify(senders));
}

const resetSendersLoad = async () => {
    await initDatabase();
    for (let i = 0; i < senders.length; i++) {
        senders[i].load = 0;
    }
    await saveDatabase();
}

module.exports = { getSenders, addSender, updateSenderWorldwide, updateSenderSafety, removeSender, getOptimalSender, updateSenderLastSent, resetSendersLoad }