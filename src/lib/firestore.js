import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ---------------------------------- */
/* Solutions                          */
/* ---------------------------------- */

const solutionsRef = collection(db, "solutions");

/** All solutions, ordered by manual `order` field. */
export async function getSolutions() {
  const q = query(solutionsRef, orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Only solutions flagged `featured: true` -- for the homepage strip. */
export async function getFeaturedSolutions() {
  const q = query(solutionsRef, where("featured", "==", true), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Single solution by its URL slug, for the detail page. Returns null if not found. */
export async function getSolutionBySlug(slug) {
  const q = query(solutionsRef, where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

/** Single solution by its Firestore doc id -- used by the admin edit form. */
export async function getSolutionById(id) {
  const snap = await getDoc(doc(db, "solutions", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Create a new solution. `data` should match the shape in plan.md section 3. */
export async function addSolution(data) {
  const docRef = await addDoc(solutionsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Update an existing solution by id. */
export async function updateSolution(id, data) {
  await updateDoc(doc(db, "solutions", id), { ...data, updatedAt: serverTimestamp() });
}

/** Delete a solution by id. */
export async function deleteSolution(id) {
  await deleteDoc(doc(db, "solutions", id));
}

/* ---------------------------------- */
/* Inquiries (contact form)           */
/* ---------------------------------- */

const inquiriesRef = collection(db, "inquiries");

/** Submit a contact form entry. `data`: { name, email, phone, message }. */
export async function addInquiry(data) {
  const docRef = await addDoc(inquiriesRef, {
    ...data,
    status: "new",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** All inquiries, newest first -- for the admin dashboard. */
export async function getInquiries() {
  const q = query(inquiriesRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Mark an inquiry as read. */
export async function markInquiryRead(id) {
  await updateDoc(doc(db, "inquiries", id), { status: "read" });
}

/* ---------------------------------- */
/* Site settings (single doc)         */
/* ---------------------------------- */

const siteSettingsDoc = doc(db, "siteSettings", "main");

/** Editable homepage bits: stats bar, contact info, social links. Returns null if not yet created. */
export async function getSiteSettings() {
  const snap = await getDoc(siteSettingsDoc);
  return snap.exists() ? snap.data() : null;
}

/** Create/update the single site settings doc (creates it on first save). */
export async function updateSiteSettings(data) {
  await setDoc(siteSettingsDoc, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}