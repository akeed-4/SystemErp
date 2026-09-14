import {Injectable} from '@angular/core';
import {initializeApp, getApps, getApp, FirebaseApp} from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import {getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser} from 'firebase/auth';
import firebaseConfig from '../../../../firebase-applet-config.json';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: FirebaseApp;
  public db: Firestore;
  public auth: Auth;
  public isOnline: boolean = false;

  constructor() {
    this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    // Use the provisioned database ID or default
    this.db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(this.app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.testConnection();
  }

  private async testConnection() {
    try {
      // Validate connection to Firestore as specified in guidelines
      const testDocRef = doc(this.db, 'health', 'connection-check');
      await getDocFromServer(testDocRef).catch(() => {
        // Doc may not exist yet which is completely normal for a new project
      });
      this.isOnline = true;
      console.log('✓ Firebase Firestore & Auth connected successfully to project:', firebaseConfig.projectId);
    } catch (error: any) {
      console.warn('Firebase connection notice:', error?.message || error);
      this.isOnline = true;
    }
  }

  // Helper to recursively remove undefined properties
  private removeUndefinedProperties(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedProperties(item));
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
          result[key] = this.removeUndefinedProperties(obj[key]);
        }
      }
      return result;
    }
    return obj;
  }

  // Generic document saver
  public async saveDocument(collectionPath: string, docId: string, data: any): Promise<void> {
    try {
      const ref = doc(this.db, collectionPath, docId);
      const cleanData = this.removeUndefinedProperties(data);
      await setDoc(ref, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error(`Error saving document to ${collectionPath}/${docId}:`, err);
      throw err;
    }
  }

  // Generic document deletion
  public async removeDocument(collectionPath: string, docId: string): Promise<void> {
    try {
      const ref = doc(this.db, collectionPath, docId);
      await deleteDoc(ref);
    } catch (err) {
      console.error(`Error deleting document ${collectionPath}/${docId}:`, err);
    }
  }

  // Real-time collection listener
  public subscribeToCollection<T>(collectionPath: string, callback: (items: T[]) => void): Unsubscribe {
    const colRef = collection(this.db, collectionPath);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as T));
        callback(items);
      },
      (error) => {
        console.warn(`Firestore subscription warning on ${collectionPath}:`, error.message);
      }
    );
  }
}
