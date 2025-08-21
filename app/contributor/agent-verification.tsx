import AgentVerification from "../components/AgentVerification";
import { useBackButtonHandler } from "../utils/backButtonHandler";

export default function AgentVerificationScreen() {
  // Use back button handler for contributor agent verification page
  useBackButtonHandler('/contributor/agent-verification');
  
  return <AgentVerification />;
} 