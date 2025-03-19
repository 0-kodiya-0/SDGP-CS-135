// pages/ContactsPage.tsx
import React, { useState } from 'react';
import ContactsList from '../components/ContactsList';
import ContactForm from '../components/ContactForm';
import GroupMembers from '../components/GroupMembers';
import { PersonType } from '../types/people.types';

import ContactGroups from '../components/ContactsGroups';
import { Tab } from '../components/common/Tab';

interface ContactsPageProps {
  accountId: string;
}

type TabType = 'contacts' | 'groups';
type ModalType = 'create-contact' | 'edit-contact' | 'group-members' | null;

const ContactsPage: React.FC<ContactsPageProps> = ({ accountId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedContact, setSelectedContact] = useState<PersonType | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const openCreateContactModal = () => {
    setSelectedContact(null);
    setModalType('create-contact');
  };

  const openEditContactModal = (contact: PersonType) => {
    setSelectedContact(contact);
    setModalType('edit-contact');
  };

  const openGroupMembersModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setModalType('group-members');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedContact(null);
    setSelectedGroupId(null);
  };

  const handleContactSaved = () => {
    closeModal();
    // Refresh the contacts list or perform any other necessary actions
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Google Contacts</h1>
          <p className="mt-1 text-gray-600">Manage your Google contacts and groups</p>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <Tab
                isActive={activeTab === 'contacts'}
                onClick={() => setActiveTab('contacts')}
              >
                Contacts
              </Tab>
              <Tab
                isActive={activeTab === 'groups'}
                onClick={() => setActiveTab('groups')}
              >
                Groups
              </Tab>
            </nav>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          {activeTab === 'contacts' && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={openCreateContactModal}
            >
              Add New Contact
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeTab === 'contacts' ? (
            <ContactsList 
              accountId={accountId} 
              onEditContact={openEditContactModal}
            />
          ) : (
            <ContactGroups 
              accountId={accountId} 
              onViewMembers={openGroupMembersModal}
            />
          )}
        </div>

        {/* Modals */}
        {modalType === 'create-contact' && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Add New Contact</h2>
              </div>
              <div className="p-6">
                <ContactForm
                  accountId={accountId}
                  onSuccess={handleContactSaved}
                  onCancel={closeModal}
                />
              </div>
            </div>
          </div>
        )}

        {modalType === 'edit-contact' && selectedContact && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Edit Contact</h2>
              </div>
              <div className="p-6">
                <ContactForm
                  accountId={accountId}
                  contact={selectedContact}
                  onSuccess={handleContactSaved}
                  onCancel={closeModal}
                />
              </div>
            </div>
          </div>
        )}

        {modalType === 'group-members' && selectedGroupId && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-auto">
              <GroupMembers
                accountId={accountId}
                groupId={selectedGroupId}
                onClose={closeModal}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;