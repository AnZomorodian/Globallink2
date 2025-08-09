
export interface Contact {
  id: string;
  voiceId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  isFavorite: boolean;
  isBlocked: boolean;
  tags: string[];
  notes?: string;
  lastContacted?: Date;
  contactFrequency: number;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  language?: string;
}

export class ContactsService {
  private static readonly CONTACTS_KEY = 'globalink_contacts';
  private static readonly RECENT_CONTACTS_KEY = 'globalink_recent_contacts';

  static getContacts(): Contact[] {
    const stored = localStorage.getItem(this.CONTACTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static addContact(contact: Omit<Contact, 'id' | 'contactFrequency' | 'isFavorite' | 'isBlocked' | 'tags'>): Contact {
    const contacts = this.getContacts();
    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isFavorite: false,
      isBlocked: false,
      tags: [],
      contactFrequency: 0
    };

    contacts.push(newContact);
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
    return newContact;
  }

  static updateContact(contactId: string, updates: Partial<Contact>): Contact | null {
    const contacts = this.getContacts();
    const index = contacts.findIndex(c => c.id === contactId);
    
    if (index === -1) return null;

    contacts[index] = { ...contacts[index], ...updates };
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
    return contacts[index];
  }

  static toggleFavorite(contactId: string): boolean {
    const contact = this.updateContact(contactId, { 
      isFavorite: !this.getContact(contactId)?.isFavorite 
    });
    return contact?.isFavorite || false;
  }

  static getContact(contactId: string): Contact | null {
    return this.getContacts().find(c => c.id === contactId) || null;
  }

  static getContactByVoiceId(voiceId: string): Contact | null {
    return this.getContacts().find(c => c.voiceId === voiceId) || null;
  }

  static getFavoriteContacts(): Contact[] {
    return this.getContacts().filter(c => c.isFavorite && !c.isBlocked);
  }

  static getRecentContacts(limit = 5): Contact[] {
    return this.getContacts()
      .filter(c => c.lastContacted && !c.isBlocked)
      .sort((a, b) => (b.lastContacted?.getTime() || 0) - (a.lastContacted?.getTime() || 0))
      .slice(0, limit);
  }

  static recordContact(voiceId: string): void {
    const contact = this.getContactByVoiceId(voiceId);
    if (contact) {
      this.updateContact(contact.id, {
        lastContacted: new Date(),
        contactFrequency: contact.contactFrequency + 1
      });
    }
  }

  static searchContacts(query: string): Contact[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getContacts().filter(contact =>
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.voiceId.toLowerCase().includes(lowercaseQuery) ||
      contact.email?.toLowerCase().includes(lowercaseQuery) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  static addTag(contactId: string, tag: string): boolean {
    const contact = this.getContact(contactId);
    if (!contact) return false;

    const tags = [...new Set([...contact.tags, tag.trim()])];
    this.updateContact(contactId, { tags });
    return true;
  }

  static removeTag(contactId: string, tag: string): boolean {
    const contact = this.getContact(contactId);
    if (!contact) return false;

    const tags = contact.tags.filter(t => t !== tag);
    this.updateContact(contactId, { tags });
    return true;
  }
}
