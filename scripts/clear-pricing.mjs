// scripts/clear-pricing.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DRY_RUN = !process.argv.includes("--apply");

async function main() {
  const snapshot = await getDocs(collection(db, "products"));
  console.log(`Found ${snapshot.size} products.`);

  let updated = 0;

  for (const productDoc of snapshot.docs) {
    const data = productDoc.data();
    const hasPrice =
      (data.priceValue !== undefined && data.priceValue !== null && data.priceValue !== "") ||
      (data.priceUnit !== undefined && data.priceUnit !== "");

    if (!hasPrice) continue;

    if (DRY_RUN) {
      console.log(`[dry run] would clear price on: ${productDoc.id} (was ₹${data.priceValue} / ${data.priceUnit})`);
    } else {
      await updateDoc(doc(db, "products", productDoc.id), {
        priceValue: null,
        priceUnit: "",
      });
      console.log(`cleared: ${productDoc.id}`);
    }
    updated++;
  }

  console.log(`${DRY_RUN ? "Would clear" : "Cleared"} price on ${updated} products.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });