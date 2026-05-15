export type Role = 'admin' | 'nasabah';

export interface User {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  password?: string;
  role: Role;
  balance: number;
  joinDate: string;
  isActive: boolean;
}

export interface HargaSampah {
  id: string;
  code: string;
  name: string;
  category: string;
  pricePerKg: number;
  lastUpdate: string;
}

export interface Setoran {
  id: string;
  userId: string;
  sampahId: string;
  weight: number;
  pricePerKg: number;
  subtotal: number;
  date: string;
}

export interface Penarikan {
  id: string;
  userId: string;
  amount: number;
  method: string;
  notes: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Penjualan {
  id: string;
  pengepulName: string;
  sampahId: string;
  weight: number;
  pricePerKg: number;
  total: number;
  date: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  ip: string; // Mock IP
  loginDate: string;
  lastActive: string;
  isCurrent: boolean;
}

const initialAdmin: User = {
  id: 'ADM-001',
  name: 'Admin Utama',
  address: 'Kantor Pusat',
  phone: '08123456789',
  email: 'admin@banksampah.com',
  password: 'admin',
  role: 'admin',
  balance: 0,
  joinDate: new Date().toISOString(),
  isActive: true,
};

const initialSampah: HargaSampah[] = [
  { id: 'S-001', code: 'PLT01', name: 'Plastik Bening', category: 'Plastik', pricePerKg: 3000, lastUpdate: new Date().toISOString() },
  { id: 'S-002', code: 'KRD01', name: 'Kardus Bekas', category: 'Kertas', pricePerKg: 1500, lastUpdate: new Date().toISOString() },
  { id: 'S-003', code: 'BSI01', name: 'Besi Tua', category: 'Besi', pricePerKg: 4000, lastUpdate: new Date().toISOString() },
];

class MockDB {
  // Simple checksum generator to detect manual tampering
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private obfuscate(data: string): string {
    const checksum = this.generateChecksum(data);
    const combined = `${checksum}:${data}`;
    return btoa(unescape(encodeURIComponent(combined)));
  }

  private deobfuscate(data: string): string | null {
    try {
      const decoded = decodeURIComponent(escape(atob(data)));
      const [checksum, content] = decoded.split(/:(.+)/);
      
      // Validate Integrity
      if (this.generateChecksum(content) !== checksum) {
        console.error("CRITICAL: Data integrity violation detected! Storage has been tampered with.");
        return null;
      }
      
      return content;
    } catch {
      return null;
    }
  }

  private get<T>(key: string, initial: T): T {
    try {
      const item = localStorage.getItem(`eb_${key}`);
      if (!item) return initial;
      const content = this.deobfuscate(item);
      if (content === null) {
        // Integrity check failed, clear and return initial
        localStorage.removeItem(`eb_${key}`);
        return initial;
      }
      return JSON.parse(content);
    } catch {
      return initial;
    }
  }

  private set<T>(key: string, value: T) {
    const stringified = JSON.stringify(value);
    localStorage.setItem(`eb_${key}`, this.obfuscate(stringified));
  }

  // Session Monitoring
  getSessions(): UserSession[] {
    return this.get<UserSession[]>('sessions', []);
  }

  setSessions(sessions: UserSession[]) {
    this.set('sessions', sessions);
  }

  recordSession(userId: string) {
    const sessions = this.getSessions();
    const userAgent = navigator.userAgent;
    
    // Mocking IP for demo purposes
    const mockIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    const newSession: UserSession = {
      id: Math.random().toString(36).substring(7),
      userId,
      deviceName: navigator.platform,
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : 'Global Browser',
      ip: mockIp,
      loginDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isCurrent: true
    };

    // Mark previous current session of this user as NOT current
    const updatedSessions = sessions.map(s => s.userId === userId ? { ...s, isCurrent: false } : s);
    updatedSessions.push(newSession);
    this.setSessions(updatedSessions);
    return newSession.id;
  }

  updateSessionActivity(sessionId: string) {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].lastActive = new Date().toISOString();
      this.setSessions(sessions);
    }
  }
  getLoginAttempts(email: string): { count: number, lastAttempt: number } {
    const attempts = this.get<Record<string, { count: number, lastAttempt: number }>>('login_attempts', {});
    return attempts[email] || { count: 0, lastAttempt: 0 };
  }

  recordLoginAttempt(email: string, success: boolean) {
    const attempts = this.get<Record<string, { count: number, lastAttempt: number }>>('login_attempts', {});
    if (success) {
      delete attempts[email];
    } else {
      const current = attempts[email] || { count: 0, lastAttempt: 0 };
      attempts[email] = {
        count: current.count + 1,
        lastAttempt: Date.now()
      };
    }
    this.set('login_attempts', attempts);
  }

  isLocked(email: string): boolean {
    const attempt = this.getLoginAttempts(email);
    if (attempt.count >= 5) {
      const lockTime = 5 * 60 * 1000; // 5 Menit
      const timeLeft = Date.now() - attempt.lastAttempt;
      return timeLeft < lockTime;
    }
    return false;
  }

  getUsers(): User[] { return this.get<User[]>('users', [initialAdmin]); }
  setUsers(users: User[]) { this.set('users', users); }

  getHargaSampah(): HargaSampah[] { return this.get<HargaSampah[]>('hargaSampah', initialSampah); }
  setHargaSampah(data: HargaSampah[]) { this.set('hargaSampah', data); }

  getSetoran(): Setoran[] { return this.get<Setoran[]>('setoran', []); }
  setSetoran(data: Setoran[]) { this.set('setoran', data); }

  getPenarikan(): Penarikan[] { return this.get<Penarikan[]>('penarikan', []); }
  setPenarikan(data: Penarikan[]) { this.set('penarikan', data); }

  getPenjualan(): Penjualan[] { return this.get<Penjualan[]>('penjualan', []); }
  setPenjualan(data: Penjualan[]) { this.set('penjualan', data); }

  getCurrentUser(): User | null { return this.get<User | null>('currentUser', null); }
  setCurrentUser(user: User | null) { this.set('currentUser', user); }
}

export const db = new MockDB();
