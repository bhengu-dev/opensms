import { Button, Text, View, NativeModules, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
const { YourModuleName } = NativeModules;

export default function Dashboard() {
    // Ovo treba da bude odvojena aplikacija koju korisnici sami bilduju, zbog potrebe za njihovim fajrbejsom, odvojiti sutra
    // niz {carrier_name, firebase_token, sim_name, country, slot_id, running}
    const [senders, setSenders] = useState([]);
    const [firebaseToken, setFirebaseToken] = useState("")
    useEffect(() => {
        fetch(global.addr + '/get-senders', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ secret: global.secret })
        })
            .then(response => response.json())
            .then(async res => {
                if (!res.ok) res.senders = []
                // niz {carrier_name, country, sim_name, slot_id}
                let arr = [];
                const running_senders = res.senders;
                let ftoken = await YourModuleName.getFirebaseToken();
                setFirebaseToken(ftoken);
                const subscriptionInfo = (await YourModuleName.getSubscriptionInfo()).sort((a, b) => a.slot_id - b.slot_id);
                for (let i in subscriptionInfo) {
                    arr.push({
                        firebase_token: await YourModuleName.getFirebaseToken(),
                        sim_name: subscriptionInfo[i].sim_name,
                        carrier_name: subscriptionInfo[i].carrier_name,
                        country: subscriptionInfo[i].country,
                        slot_id: subscriptionInfo[i].slot_id,
                        running: running_senders.filter(e => ((e.firebase_token == ftoken) && (e.sim_name == subscriptionInfo[i].sim_name))).length > 0
                    });
                }


                // String

                // niz {country, firebase_token, sim_name, user_id}
                for (let i in running_senders) {
                    if (running_senders[i].firebase_token == ftoken) continue;
                    arr.push({
                        firebase_token: running_senders[i].firebase_token,
                        sim_name: running_senders[i].sim_name,
                        carrier_name: null,
                        country: running_senders[i].country,
                        slot_id: null,
                        running: true
                    });
                }
                setSenders(arr);
            })
            .catch(e => {

            })
    }, [])
    return (
        <View>
            <Text>Dashboard</Text>
            <Text>This device</Text>
            <FlatList
                data={senders.filter(e => {
                    return (firebaseToken == e.firebase_token)
                })}
                renderItem={({ item }) => {
                    return <TouchableOpacity
                        onPress={() => {
                            if (item.running) {
                                fetch(global.addr + '/remove-sender', {
                                    method: "POST",
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ country: item.country, secret: global.secret })
                                })
                                    .then(response => response.json())
                                    .then(async res => {
                                        if (!res.ok)
                                            return Alert.alert("Error", "Error stopping the service")
                                        item.running = false;
                                        setSenders(new Array(...senders));
                                        Alert.alert("Service stopped", "Successfully stopped the service");
                                    })
                                    .catch(e => {
                                        Alert.alert("Error", "Error stopping the service")
                                    })
                            }
                            else {
                                fetch(global.addr + '/add-sender', {
                                    method: "POST",
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ country: item.country, firebase_token: item.firebase_token, sim_name: item.sim_name, secret: global.secret })
                                })
                                    .then(response => response.json())
                                    .then(async res => {
                                        if (!res.ok)
                                            return Alert.alert("Error", res.message || "Error adding service")
                                        item.running = true;
                                        setSenders(new Array(...senders));
                                        Alert.alert("Service started", "Service successfully started");
                                    })
                                    .catch(e => {
                                        Alert.alert("Error", "Error adding service")
                                    })
                            }
                        }}
                        style={{ backgroundColor: item.running ? "green" : "red", padding: 20, margin: 10 }}>
                        <Text>{item.sim_name}</Text>
                        <Text>Country: {item.country}</Text>
                    </TouchableOpacity>
                }}
            ></FlatList>
            <Text>Other devices</Text>
            <FlatList
                data={senders.filter(e => {
                    return (firebaseToken != e.firebase_token)
                })}
                renderItem={({ item }) => {
                    return <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Stop service?", "If you stop the service, you will have to re-enable it from the device that you used to start it. ", [
                                {
                                    text: "Cancel",
                                    onPress: () => { },
                                    style: "cancel"
                                }, {
                                    text: "Ok",
                                    onPress: () => {

                                        fetch(global.addr + '/remove-sender', {
                                            method: "POST",
                                            headers: {
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ country: item.country, secret: global.secret })
                                        })
                                            .then(response => response.json())
                                            .then(async res => {
                                                if (!res.ok)
                                                    return Alert.alert("Error", "Error stopping the service")
                                                Alert.alert("Service stopped", "Successfully stopped the service");
                                                senders.splice(senders.indexOf(item), 1);
                                                setSenders(new Array(...senders));
                                            })
                                            .catch(e => {
                                                Alert.alert("Error", "Error stopping the service")
                                            })
                                    },
                                    style: "destructive"
                                }
                            ], {
                                cancelable: true,
                                onDismiss: () => { }
                            })
                            // Alertuj da li zelis zaista da brises
                        }}
                        style={{ backgroundColor: item.running ? "green" : "red", padding: 20, margin: 10 }}
                    >
                        <Text>{item.sim_name}</Text>
                        <Text>Country: {item.country}</Text>
                    </TouchableOpacity>
                }}
            ></FlatList>
        </View>
    );
}