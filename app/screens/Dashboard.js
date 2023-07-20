import { Button, Text, View, NativeModules, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, StyleSheet, Image, InteractionManager, BackHandler } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
const { YourModuleName } = NativeModules;
import CheckBox from '@react-native-community/checkbox';
import countriesData from "country-list-js"
import { SearchBar } from 'react-native-elements'
import { useRef } from 'react';

const countryList = Object.keys(countriesData.all).sort((a, b) => countriesData.findByIso2(a).name.localeCompare(countriesData.findByIso2(b).name));
const iso2IndexMapping = {};
for (let i = 0; i < countryList.length; i++) {
    iso2IndexMapping[countryList[i]] = i;
}

export default function Dashboard() {
    // Ovo treba da bude odvojena aplikacija koju korisnici sami bilduju, zbog potrebe za njihovim fajrbejsom, odvojiti sutra
    // niz {carrier_name, firebase_token, sim_name, country, slot_id, running}
    const [senders, setSenders] = useState([]);
    const [simCards, setSimCards] = useState([]);
    const [sim, setSim] = useState("")
    const [country, setCountry] = useState("")
    const [search, setSearch] = useState("")
    const [filteredCountries, setFilteredCountries] = useState([]);

    const flatListRef = useRef();

    useEffect(() => {
        if (sim) {
            const backAction = () => {
                setCountry("");
                setSim("");
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }
    }, [sim])


    useEffect(() => {
        if (!country) return;
        const countryListWithoutCountry = countryList.filter(e => e != country.toUpperCase())
        const fullList = [country.toUpperCase(), ...countryListWithoutCountry]
        if (search === '') {
            setFilteredCountries(fullList);
        } else {
            const filtered = fullList.filter(iso2 =>
                countriesData.findByIso2(iso2).name.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredCountries(filtered);
        }
    }, [search, country]);

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
                const subscriptionInfo = (await YourModuleName.getSubscriptionInfo()).sort((a, b) => a.slot_id - b.slot_id);
                setSimCards(new Array(...subscriptionInfo))
                setSenders(res.senders);
            })
            .catch(e => {
                console.error(e);
            })
    }, [])
    return (
        sim ?
            <View style={styles.formContainer}>
                <Text style={{ ...styles.formLabel, marginBottom: 20 }}>Select country for new sender ({sim.sim_name}): </Text>
                <SearchBar
                    placeholder="Search for a country..."
                    onChangeText={setSearch}
                    value={search}
                    containerStyle={{ backgroundColor: 'white' }}
                    inputContainerStyle={{ backgroundColor: 'white' }}
                    inputStyle={{ color: 'black' }}
                    placeholderTextColor='grey'
                />
                <FlatList
                    ref={flatListRef} // Add this line
                    data={filteredCountries}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.countryItem} onPress={async () => {
                            const firebase_token = await YourModuleName.getFirebaseToken();
                            fetch(global.addr + '/add-sender', {
                                method: "POST",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ country: item.toLowerCase(), firebase_token, sim_name: sim.sim_name, secret: global.secret })
                            })
                                .then(response => response.json())
                                .then(async res => {
                                    if (!res.ok)
                                        return Alert.alert("Error", res.message || "Error adding service")

                                    setSenders(new Array(...senders, { ...res.sender }));
                                    Alert.alert("Service started", "Service successfully added");
                                    setSim(null)
                                })
                                .catch(e => {
                                    Alert.alert("Error", "Error adding service")
                                })
                        }}>
                            <Image
                                source={{ uri: "https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/" + item.toLowerCase() + ".png" }}
                                style={styles.flagImage}
                            />
                            <Text>{countriesData.findByIso2(item).name}</Text>
                        </TouchableOpacity>
                    )}
                    style={{ marginBottom: 20, marginTop: 10 }}
                />
            </View> :
            <View style={styles.container}>
                <Text style={styles.title}>Dashboard</Text>
                <Text style={styles.subTitle}>Your sim cards</Text>
                <FlatList
                    data={simCards}
                    keyExtractor={e => e.slot_id}
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{item.sim_name}</Text>
                                    <Text style={styles.cardDetails}>Slot: {item.slot_id}</Text>
                                    <Text style={styles.cardDetails}>Carrier: {item.carrier_name}</Text>
                                    <Text style={styles.cardDetails}>Country: {countriesData.findByIso2(item.country.toUpperCase())?.name}</Text>
                                </View>
                                <TouchableOpacity style={styles.cardButton} onPress={() => {
                                    setCountry(item.country);
                                    setSim(item);
                                }}>
                                    <Text style={styles.buttonText}>Add sender</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}></FlatList>
                <Text style={styles.subTitle}>Senders</Text>
                <View style={styles.listContainer}>
                    <FlatList
                        data={senders}
                        keyExtractor={item => (item.sim_name + item.country + item.firebase_token)}
                        renderItem={({ item, index }) => {
                            return (
                                <View style={styles.card}>
                                    <Image
                                        source={{ uri: "https://raw.githubusercontent.com/hampusborgos/country-flags/main/png250px/" + item.country + ".png" }}
                                        style={styles.flag}
                                    />
                                    <View style={styles.cardContent}>
                                        <Text style={styles.nameText}>SIM name: {item.sim_name}</Text>
                                        <Text style={styles.countryText}>Country: {countriesData.findByIso2(item.country.toUpperCase())?.name}</Text>
                                        <View style={styles.checkBoxContainer}>
                                            <View style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                                <CheckBox
                                                    value={item.worldwide}
                                                    onValueChange={() => {
                                                        fetch(global.addr + '/update-sender-worldwide', {
                                                            method: "POST",
                                                            headers: {
                                                                'Accept': 'application/json',
                                                                'Content-Type': 'application/json'
                                                            },
                                                            body: JSON.stringify({ id: item.id, worldwide: !item.worldwide, secret: global.secret })
                                                        })
                                                            .then(response => response.json())
                                                            .then(async res => {
                                                                if (!res.ok)
                                                                    return Alert.alert("Error", res.message || "Error updating service")
                                                                item.worldwide = !item.worldwide;
                                                                setSenders(new Array(...senders));
                                                                Alert.alert("Service updated", "Service successfully updated");
                                                            })
                                                            .catch(e => {
                                                                Alert.alert("Error", "Error updating service")
                                                            })
                                                    }}
                                                /><Text style={{ fontSize: 16, color: "#000000" }}> Worldwide</Text></View>
                                            <View style={{ display: "flex", flexDirection: "row", alignItems: "center" }}><CheckBox
                                                value={item.safety}
                                                onValueChange={() => {
                                                    fetch(global.addr + '/update-sender-safety', {
                                                        method: "POST",
                                                        headers: {
                                                            'Accept': 'application/json',
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ id: item.id, safety: !item.safety, secret: global.secret })
                                                    })
                                                        .then(response => response.json())
                                                        .then(async res => {
                                                            if (!res.ok)
                                                                return Alert.alert("Error", res.message || "Error updating service")
                                                            item.safety = !item.safety;
                                                            setSenders(new Array(...senders));
                                                            Alert.alert("Service updated", "Service successfully updated");
                                                        })
                                                        .catch(e => {
                                                            Alert.alert("Error", "Error updating service")
                                                        })
                                                }}
                                            /><Text style={{ fontSize: 16, color: "#000000" }}> Safety</Text></View>
                                        </View>
                                        <View style={styles.buttonContainer}>
                                            <Button title='Remove' onPress={() => {
                                                fetch(global.addr + '/remove-sender', {
                                                    method: "POST",
                                                    headers: {
                                                        'Accept': 'application/json',
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({ id: item.id, secret: global.secret })
                                                })
                                                    .then(response => response.json())
                                                    .then(async res => {
                                                        if (!res.ok)
                                                            return Alert.alert("Error", "Error stopping the service")
                                                        senders.splice(index, 1)
                                                        setSenders(new Array(...senders));
                                                        Alert.alert("Service stopped", "Successfully stopped the service");
                                                    })
                                                    .catch(e => {
                                                        Alert.alert("Error", "Error stopping the service")
                                                    })
                                            }} color="#b71c1c" />
                                        </View>
                                    </View>
                                </View>
                            );
                        }}
                    />
                </View>
            </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },

    card: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        margin: 5,
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
    },

    cardContent: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    cardInfo: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDetails: {
        fontSize: 14,
    },
    cardButton: {
        backgroundColor: "#007BFF",
        padding: 10,
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        textAlign: 'center',
    },
    formContainer: {
        padding: 20,
    },
    formLabel: {
        fontSize: 18,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        fontSize: 18,
        borderRadius: 6,
        marginBottom: 10,
    },
    listContainer: {
        height: "50%",
        marginBottom: 20
    },
    flag: {
        width: 80,
        height: 56,
        marginRight: 20,
        alignSelf: "center"
    },
    checkBoxContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center"
    },
    buttonContainer: {
        marginTop: 10,
    },
    signOutButton: {
        marginTop: 20,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    countryItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        flexDirection: 'row',  // Add this for aligning flag and country name
        alignItems: 'center',  // Align items vertically
    },
    buttonContainer2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    addButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 5,
    }, flagImage: {
        width: 40,
        height: 28,
        marginRight: 12, // Add some space between the flag and the text
    },
});