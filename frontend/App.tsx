import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { API_URL } from "./src/config";

type Entry = { id: number; friendName: string; amount: number; dueDate: string; repaid: boolean; repaidAt?: string };
type Summary = { totalLent: number; totalRepaid: number; overdueAmount: number };

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalLent: 0, totalRepaid: 0, overdueAmount: 0 });
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);

  const request = async (path: string, options: RequestInit = {}, authToken = token) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  };


  const refresh = useCallback(async (currentToken: string) => {
    const [list, totals] = await Promise.all([
      request("/entries", {}, currentToken),
      request("/summary", {}, currentToken),
    ]);

    console.log("ENTRIES API RESPONSE:", JSON.stringify(list));
    console.log("SUMMARY API RESPONSE:", JSON.stringify(totals));

    setEntries(Array.isArray(list) ? list : []);
    setSummary(totals);
  }, []);


  useEffect(() => { AsyncStorage.getItem("miniledger-token").then(saved => { if (saved) setToken(saved); }); }, []);
  useEffect(() => { if (token) refresh(token).catch(e => Alert.alert("Could not load data", e.message)); }, [token]);

  const handleRequestOtp = async () => {
    if (!/^\+?[1-9]\d{7,14}$/.test(phone.trim())) return Alert.alert("Check phone", "Enter a valid phone number with country code if needed.");
    setLoading(true);
    try { await request("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone: phone.trim() }) }, null); setOtpRequested(true); Alert.alert("OTP requested", "Check the API server terminal for the mock OTP."); }
    catch (e: any) { Alert.alert("Could not request OTP", e.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) return Alert.alert("Check OTP", "Enter the 6-digit OTP printed in the server log.");
    setLoading(true);
    try {
      const data = await request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone: phone.trim(), otp }) }, null);
      await AsyncStorage.setItem("miniledger-token", data.token);
      setToken(data.token);
    } catch (e: any) { Alert.alert("Login failed", e.message); }
    finally { setLoading(false); }
  };

  const addEntry = async () => {
    const numericAmount = Number(amount);
    if (!friendName.trim()) return Alert.alert("Friend name required", "Enter your friend's name.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return Alert.alert("Invalid amount", "Amount must be greater than zero.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate))) return Alert.alert("Invalid date", "Use YYYY-MM-DD.");
    setLoading(true);
    try {
      await request("/entries", { method: "POST", body: JSON.stringify({ friendName: friendName.trim(), amount: numericAmount, dueDate }) });
      setFriendName(""); setAmount(""); setShowForm(false); await refresh(token!);
    } catch (e: any) { Alert.alert("Could not save entry", e.message); }
    finally { setLoading(false); }
  };

  const markRepaid = async (entry: Entry) => {
    console.log("Repay button pressed:", entry.id);

    try {
      const result = await request(`/entries/${entry.id}/repay`, {
        method: "PATCH",
      });

      console.log("Repayment API response:", result);

      await refresh(token!);
      Alert.alert("Success", "Entry marked as repaid.");
    } catch (e: any) {
      console.log("Repayment error:", e);
      Alert.alert("Could not update entry", e.message || "Unknown error");
    }
  };

  const logout = async () => { await AsyncStorage.removeItem("miniledger-token"); setToken(null); setOtp(""); setOtpRequested(false); };

  const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const isOverdue = (entry: Entry) => !entry.repaid && entry.dueDate < new Date().toISOString().slice(0, 10);

  if (!token) return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.loginWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.logo}><Text style={styles.logoText}>₹</Text></View>
        <Text style={styles.brand}>MiniLedger</Text>
        <Text style={styles.subtitle}>Keep every friendly loan in one place.</Text>
        <Text style={styles.label}>Phone number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+919876543210" keyboardType="phone-pad" autoCapitalize="none" />
        {otpRequested && <><Text style={styles.label}>One-time password</Text><TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="6-digit OTP" keyboardType="number-pad" maxLength={6} /></>}
        <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={otpRequested ? handleVerify : handleRequestOtp}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{otpRequested ? "Verify and continue" : "Get OTP"}</Text>}
        </TouchableOpacity>
        {otpRequested && <TouchableOpacity onPress={handleRequestOtp}><Text style={styles.link}>Resend OTP</Text></TouchableOpacity>}
        <Text style={styles.helper}>Demo login: OTP is printed in your API terminal.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}><View><Text style={styles.headerTitle}>MiniLedger</Text><Text style={styles.headerSub}>Your money, accounted for.</Text></View><TouchableOpacity onPress={logout}><Text style={styles.logout}>Log out</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL LENT</Text><Text style={styles.total}>{money(summary.totalLent)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMini}><Text style={styles.miniLabel}>Repaid</Text><Text style={styles.miniValue}>{money(summary.totalRepaid)}</Text></View>
            <View style={styles.summaryMini}><Text style={styles.miniLabel}>Overdue</Text><Text style={[styles.miniValue, { color: "#fecaca" }]}>{money(summary.overdueAmount)}</Text></View>
          </View>
        </View>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your loans</Text><TouchableOpacity onPress={() => setShowForm(!showForm)}><Text style={styles.addText}>{showForm ? "Cancel" : "+ Add loan"}</Text></TouchableOpacity></View>
        {showForm && <View style={styles.formCard}>
          <Text style={styles.label}>Friend's name</Text><TextInput style={styles.input} value={friendName} onChangeText={setFriendName} placeholder="e.g. Rahul" />
          <Text style={styles.label}>Amount (₹)</Text><TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="e.g. 1500" keyboardType="decimal-pad" />
          <Text style={styles.label}>Due date (YYYY-MM-DD)</Text><TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="2026-10-31" />
          <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={addEntry}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save loan</Text>}</TouchableOpacity>
        </View>}
        {entries.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>◎</Text><Text style={styles.emptyTitle}>No loans yet</Text><Text style={styles.emptyText}>Add your first loan to start keeping track.</Text></View> :
          <FlatList data={entries} scrollEnabled={false} keyExtractor={item => String(item.id)} renderItem={({ item }) => (
            <View style={[styles.entryCard, isOverdue(item) && styles.overdueCard]}>
              <View style={styles.entryTop}><View style={styles.avatar}><Text style={styles.avatarText}>{item.friendName.slice(0, 1).toUpperCase()}</Text></View><View style={styles.entryInfo}><Text style={styles.friend}>{item.friendName}</Text><Text style={styles.due}>Due {item.dueDate}</Text></View><View style={styles.amountWrap}><Text style={styles.entryAmount}>{money(item.amount)}</Text><Text style={[styles.status, item.repaid ? styles.repaidStatus : isOverdue(item) ? styles.overdueStatus : styles.pendingStatus]}>{item.repaid ? "REPAID" : isOverdue(item) ? "OVERDUE" : "PENDING"}</Text></View></View>
              {!item.repaid && (
                <TouchableOpacity
                  style={styles.repayButton}
                  activeOpacity={0.6}
                  onPress={() => {
                    console.log("REPAY TAPPED:", item.id);

                    Alert.alert(
                      "Confirm repayment",
                      `Mark the ₹${item.amount} loan from ${item.friendName} as fully repaid?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Confirm",
                          onPress: () => markRepaid(item),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.repayText}>Mark as repaid ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          )} />}
        <Text style={styles.footer}>See all your loans here.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F6FC",
    marginTop: 16,
  },
  loginWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#344563",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18
  },
  logoText: { color: "white", fontSize: 34, fontWeight: "800" },
  brand: { fontSize: 30, fontWeight: "800", textAlign: "center", color: "#344563" },
  subtitle: { fontSize: 15, textAlign: "center", color: "#718096", marginTop: 8, marginBottom: 34 },
  label: {
    color: "#344563",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#17233B",
  },
  primaryButton: {
    backgroundColor: "#243B64",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 18,
    minHeight: 50,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  link: {
    color: "#5278C7",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "700",
  },
  helper: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 24
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#243B64",
  },
  headerSub: {
    color: "#758198",
    marginTop: 4,
    fontSize: 13,
  },
  logout: {
    color: "#5278C7",
    fontWeight: "700",
    padding: 8,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: "#243B64",
    borderRadius: 24,
    padding: 24,
    marginTop: 4,
    marginBottom: 28,
  },
  summaryLabel: {
    color: "#DCE5F8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  total: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#405681",
  },
  summaryMini: {
    flex: 1,
  },

  miniLabel: {
    color: "#DCE5F8",
    fontSize: 12,
  },
  miniValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#17233B",
    fontSize: 21,
    fontWeight: "800",
  },
  addText: {
    color: "#5278C7",
    fontWeight: "800",
    padding: 8,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E6F0",
  },
  overdueCard: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF8F8",
  },
  entryTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E7EDFA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#243B64",
    fontWeight: "800",
    fontSize: 18,
  },
  entryInfo: {
    flex: 1,
    marginLeft: 11,
  },
  friend: {
    color: "#17233B",
    fontWeight: "800",
    fontSize: 15,
  },
  due: {
    color: "#758198",
    fontSize: 12,
    marginTop: 5,
  },

  amountWrap: {
    alignItems: "flex-end",
  },

  entryAmount: {
    color: "#17233B",
    fontWeight: "800",
    fontSize: 16,
  },

  status: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginTop: 5,
  },

  repaidStatus: {
    color: "#16805D",
  },

  overdueStatus: {
    color: "#DC2626",
  },

  pendingStatus: {
    color: "#B7791F",
  },

  repayButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#B8C8E6",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 12,
  },

  repayText: {
    color: "#5278C7",
    fontWeight: "700",
    fontSize: 12,
  },

  empty: {
    alignItems: "center",
    paddingVertical: 44,
  },

  emptyIcon: {
    color: "#8296BC",
    fontSize: 38,
  },

  emptyTitle: {
    color: "#17233B",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#758198",
    marginTop: 7,
    textAlign: "center",
  },

  footer: {
    color: "#8994A8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
  },
});
