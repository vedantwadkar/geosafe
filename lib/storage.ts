import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = '@geosafe_contacts';
const FEEDBACK_KEY = '@geosafe_feedback';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
}

export interface SafetyFeedback {
  id: string;
  latitude: number;
  longitude: number;
  rating: number;
  timestamp: number;
}

export async function getContacts(): Promise<EmergencyContact[]> {
  const data = await AsyncStorage.getItem(CONTACTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveContacts(contacts: EmergencyContact[]): Promise<void> {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export async function addContact(contact: EmergencyContact): Promise<void> {
  const contacts = await getContacts();
  contacts.push(contact);
  await saveContacts(contacts);
}

export async function updateContact(updated: EmergencyContact): Promise<void> {
  const contacts = await getContacts();
  const idx = contacts.findIndex(c => c.id === updated.id);
  if (idx !== -1) {
    contacts[idx] = updated;
    await saveContacts(contacts);
  }
}

export async function deleteContact(id: string): Promise<void> {
  const contacts = await getContacts();
  await saveContacts(contacts.filter(c => c.id !== id));
}

export async function saveFeedback(feedback: SafetyFeedback): Promise<void> {
  const data = await AsyncStorage.getItem(FEEDBACK_KEY);
  const list: SafetyFeedback[] = data ? JSON.parse(data) : [];
  list.push(feedback);
  await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
}
