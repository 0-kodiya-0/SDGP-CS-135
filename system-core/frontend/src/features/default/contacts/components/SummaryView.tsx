import React, { useState, useEffect, useMemo } from 'react';
import { User, Search, Plus, Users, X, Phone, MessageCircle } from 'lucide-react';
import CreateContactForm from './CreateContactForms';
import GroupView from './GroupView';
import ExpandView from './ExpandView';
import GroupDetailView from './GroupDetailView';
import CreateGroupForm from './CreateGroupForms';
import { useContacts } from '../hooks/useContacts.google';
import { PersonType, ContactGroupType } from '../types/types.data';
import { useTabs } from '../../../required/tab_view';

interface SummaryViewProps {
  accountId: string;
  compact?: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({ accountId, compact = false }) => {
  const {
    contacts,
    loading,
    error,
    nextPageToken,
    fetchContacts,
  } = useContacts(accountId);
  
  // Use the tabs hook
  const { addTab, updateTab, closeTab, setActiveTab: setActiveTabInContext, tabs } = useTabs();
  
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'all' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState<boolean>(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false);
  
  // Keep track of our main content tab ID
  const [mainTabId, setMainTabId] = useState<string | null>(null);
  
  // Track current tab content type
  const [currentTabContent, setCurrentTabContent] = useState<'contact' | 'group' | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase().trim();
    return contacts.filter(contact => {
      // Search in names
      const nameMatch = contact.names?.some(name => 
        name.displayName?.toLowerCase().includes(query) ||
        name.givenName?.toLowerCase().includes(query) ||
        name.familyName?.toLowerCase().includes(query)
      );
      
      // Search in emails
      const emailMatch = contact.emailAddresses?.some(email => 
        email.value?.toLowerCase().includes(query)
      );
      
      // Search in phone numbers
      const phoneMatch = contact.phoneNumbers?.some(phone => 
        phone.value?.toLowerCase().includes(query)
      );
      
      // Search in organizations
      const orgMatch = contact.organizations?.some(org =>
        org.name?.toLowerCase().includes(query) ||
        org.title?.toLowerCase().includes(query) ||
        org.department?.toLowerCase().includes(query)
      );
      
      return nameMatch || emailMatch || phoneMatch || orgMatch;
    });
  }, [contacts, searchQuery]);

  const handleContactClick = (contact: PersonType) => {
    setSelectedContactId(contact.resourceName || null);
    
    // Get the contact name for the tab title
    const contactName = contact.names?.[0]?.displayName || 'Unnamed Contact';
    
    // Create the tab content with the selected contact
    const tabContent = (
      <ExpandView 
        selectedContact={contact} 
        accountId={accountId} 
        onContactDeleted={() => {
          fetchContacts();
          // If the current contact is deleted, close its tab
          if (mainTabId) {
            closeTab(mainTabId);
            setMainTabId(null);
            setCurrentTabContent(null);
          }
        }}
        onContactUpdated={() => {
          fetchContacts();
        }}
      />
    );
    
    // Check if we already have a main tab
    if (mainTabId) {
      // Update the existing tab with new content and title
      updateTab(mainTabId, {
        title: contactName,
        content: tabContent
      });
      
      // Activate the tab
      setActiveTabInContext(mainTabId);
    } else {
      // Create a new tab
      const newTabId = addTab(contactName, tabContent);
      setMainTabId(newTabId);
    }
    
    // Update current content type
    setCurrentTabContent('contact');
  };

  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchContacts({ pageToken: nextPageToken });
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      // When opening search, focus the input
      setTimeout(() => {
        const searchInput = document.getElementById('contact-search-input');
        if (searchInput) searchInput.focus();
      }, 0);
    } else {
      // When closing search, clear the query
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    document.getElementById('contact-search-input')?.focus();
  };

  const handleCreateContact = () => {
    setIsCreateContactModalOpen(true);
  };

  const handleCreateGroup = () => {
    setIsCreateGroupModalOpen(true);
  };

  const handleContactCreated = (newContact: PersonType) => {
    // Refresh the contacts list to include the new contact
    fetchContacts();
    
    // Open the newly created contact in the tab
    handleContactClick(newContact);
  };

  const handleGroupSelect = (group: ContactGroupType) => {
    // Get the group name for the tab title
    const groupName = group.formattedName || group.name || "Group";
    
    // Create the tab content for the group
    const tabContent = (
      <GroupDetailView 
        group={group} 
        accountId={accountId} 
        onRefresh={() => {
          // Refresh groups list if needed
        }}
      />
    );
    
    // Check if we already have a main tab
    if (mainTabId) {
      // Update the existing tab with new content and title
      updateTab(mainTabId, {
        title: groupName,
        content: tabContent
      });
      
      // Activate the tab
      setActiveTabInContext(mainTabId);
    } else {
      // Create a new tab
      const newTabId = addTab(groupName, tabContent);
      setMainTabId(newTabId);
    }
    
    // Update current content type
    setCurrentTabContent('group');
  };

  // When a tab is closed, check if it's our main tab and update state accordingly
  useEffect(() => {
    if (mainTabId && !tabs.some(tab => tab.id === mainTabId)) {
      setMainTabId(null);
      setCurrentTabContent(null);
      
      if (currentTabContent === 'contact') {
        setSelectedContactId(null);
      }
    }
  }, [tabs, mainTabId, currentTabContent]);

  // Google icon SVG for indicating Google-synced contacts
  const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 ml-1">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  // Determine which contacts to display based on search status
  const displayedContacts = isSearching ? filteredContacts : contacts;
  const isSearchActive = isSearching && searchQuery.trim() !== '';

  // Render compact view if sidebar is collapsed
  if (compact) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <button
            onClick={handleCreateContact}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="Add new contact"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          <div className="flex flex-col items-center py-4 space-y-6">
            {displayedContacts.slice(0, 15).map((contact) => (
              <div
                key={contact.resourceName}
                className={`p-2 rounded-full hover:bg-gray-100 cursor-pointer ${
                  selectedContactId === contact.resourceName ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleContactClick(contact)}
                title={contact.names?.[0]?.displayName || 'Unnamed Contact'}
              >
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {contact.photos && contact.photos[0]?.url ? (
                    <img
                      src={contact.photos[0].url}
                      alt={contact.names?.[0]?.displayName || 'Contact'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      {/* Create Contact Modal */}
      {isCreateContactModalOpen && (
        <CreateContactForm 
          accountId={accountId}
          isOpen={isCreateContactModalOpen}
          onClose={() => setIsCreateContactModalOpen(false)}
          onContactCreated={handleContactCreated}
        />
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <CreateGroupForm 
          accountId={accountId}
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          onGroupCreated={() => {
            // Refresh or update group list if needed
            // Switch to groups tab to show the newly created group
            setActiveSummaryTab('groups');
          }}
        />
      )}

      {/* Header section with title and action buttons */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Contacts</h2>
          <div className="flex space-x-2">
            {activeSummaryTab === 'all' && (
              <button 
                className={`p-2 ${isSearching ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'} rounded-full`}
                onClick={toggleSearch}
                title={isSearching ? "Close search" : "Search contacts"}
              >
                <Search size={18} />
              </button>
            )}
            
            <button 
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              title={activeSummaryTab === 'all' ? "Add new contact" : "Create new group"}
              onClick={activeSummaryTab === 'all' ? handleCreateContact : handleCreateGroup}
            >
              <Plus size={18} />
            </button>
            
            {activeSummaryTab === 'all' && (
              <button 
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                title="Manage groups"
                onClick={() => setActiveSummaryTab('groups')}
              >
                <Users size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search input - conditionally visible when on contacts tab */}
        {activeSummaryTab === 'all' && isSearching && (
          <div className="mb-3">
            <div className="relative">
              <input
                id="contact-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab navigation - hide when searching */}
        {!isSearchActive && (
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeSummaryTab === 'all' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveSummaryTab('all')}
            >
              All Contacts
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeSummaryTab === 'groups' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveSummaryTab('groups')}
            >
              Groups
            </button>
          </div>
        )}
      </div>

      {/* Search results indicator */}
      {activeSummaryTab === 'all' && isSearchActive && (
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
          Found {filteredContacts.length} {filteredContacts.length === 1 ? 'result' : 'results'} for "{searchQuery}"
        </div>
      )}

      {/* Conditional rendering based on active tab */}
      {activeSummaryTab === 'groups' ? (
        <GroupView 
          accountId={accountId}
          onGroupSelect={handleGroupSelect}
          onCreateGroupClick={handleCreateGroup}
          isCreateGroupModalOpen={isCreateGroupModalOpen}
          onCloseCreateGroupModal={() => setIsCreateGroupModalOpen(false)}
        />
      ) : (
        <>
          {/* Contact list - scrollable section with custom scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {loading && displayedContacts.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-500 text-center">
                <p>{error}</p>
              </div>
            ) : displayedContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {isSearchActive ? (
                  <>
                    <Search size={48} className="text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No matching contacts</h3>
                    <p className="text-sm text-gray-400 mb-4">Try a different search term</p>
                    <button 
                      onClick={clearSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <User size={48} className="text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No contacts found</h3>
                    <p className="text-sm text-gray-400 mb-4">Start by adding a new contact</p>
                    <button 
                      onClick={handleCreateContact}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Plus size={16} className="inline mr-1" /> Add Contact
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedContacts.map((contact) => (
                  <div
                    key={contact.resourceName}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      selectedContactId === contact.resourceName 
                        ? 'bg-blue-50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Contact avatar or placeholder - clickable area */}
                      <div 
                        className="flex-shrink-0 relative cursor-pointer"
                        onClick={() => handleContactClick(contact)}
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {contact.photos && contact.photos[0]?.url ? (
                            <img
                              src={contact.photos[0].url}
                              alt={contact.names?.[0]?.displayName || 'Contact'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User size={20} className="text-gray-500" />
                          )}
                        </div>
                        {/* Google indicator in bottom right corner */}
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                          <GoogleIcon />
                        </div>
                      </div>
                      
                      {/* Contact details - clickable area */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleContactClick(contact)}
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900 truncate">
                            {contact.names?.[0]?.displayName || 'Unnamed Contact'}
                          </h4>
                        </div>
                        {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {contact.emailAddresses[0].value}
                          </p>
                        )}
                        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {contact.phoneNumbers[0].value}
                          </p>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex-shrink-0 flex space-x-2">
                        {/* Call button */}
                        <button 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Call"
                          onClick={() => console.log('Call button clicked for:', contact.names?.[0]?.displayName)}
                        >
                          <Phone size={18} />
                        </button>
                        
                        {/* Chat button */}
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Chat"
                          onClick={() => console.log('Chat button clicked for:', contact.names?.[0]?.displayName)}
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Load more button - Don't show when filtering */}
          {nextPageToken && !isSearchActive && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryView;