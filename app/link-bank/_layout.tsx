import { Stack } from "expo-router";
import { BankProvider } from "./context/bank-context";

export default function Layout() {
  return (
    <BankProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BankProvider>
  );
}
