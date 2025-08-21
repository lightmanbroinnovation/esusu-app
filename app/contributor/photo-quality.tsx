import { PhotoQualityCheck } from "../components/PhotoQualityCheck";
import { useBackButtonHandler } from "../utils/backButtonHandler";

export default function PhotoQualityScreen() {
  // Use back button handler for contributor photo quality page
  useBackButtonHandler('/contributor/photo-quality');
  
  return <PhotoQualityCheck />;
} 