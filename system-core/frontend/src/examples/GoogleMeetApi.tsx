import { useState, useEffect } from "react";
import {
    useMeetApi,
    MeetingData,
    formatMeetingTime,
    calculateDuration,
    MeetingFormData,
    formToMeetingParams,
    COMMON_TIMEZONES
} from "../features/default/chat";
import { useAuth, useAccount } from "../features/default/user_account";

interface MeetingsListProps {
    accountId: string;
    onEditMeeting?: (meeting: MeetingData) => void;
    onViewDetails?: (meeting: MeetingData) => void;
}

const MeetingsList: React.FC<MeetingsListProps> = ({
    accountId,
    onEditMeeting,
    onViewDetails
}) => {
    const {
        meetings,
        loading,
        error,
        nextPageToken,
        listMeetings,
        deleteMeeting
    } = useMeetApi(accountId);

    const [timeRange, setTimeRange] = useState<'upcoming' | 'past' | 'all'>('upcoming');

    useEffect(() => {
        // Load meetings when component mounts or time range changes
        loadMeetings();
    }, [accountId, timeRange]);

    const loadMeetings = () => {
        const now = new Date().toISOString();

        const params: {
            timeMin?: string;
            timeMax?: string;
            maxResults?: number;
            orderBy?: 'startTime' | 'updated';
        } = {
            maxResults: 30,
            orderBy: 'startTime'
        };

        if (timeRange === 'upcoming') {
            params.timeMin = now;
        } else if (timeRange === 'past') {
            params.timeMax = now;
            params.orderBy = 'updated'; // Show most recently updated first for past meetings
        }

        listMeetings(params);
    };

    const handleLoadMore = () => {
        if (!nextPageToken) return;

        const now = new Date().toISOString();

        const params: {
            timeMin?: string;
            timeMax?: string;
            pageToken: string;
        } = {
            pageToken: nextPageToken
        };

        if (timeRange === 'upcoming') {
            params.timeMin = now;
        } else if (timeRange === 'past') {
            params.timeMax = now;
        }

        listMeetings(params);
    };

    const handleDeleteMeeting = async (meetingId: string) => {
        if (window.confirm('Are you sure you want to delete this meeting? This will remove it for all participants.')) {
            const notifyAttendees = window.confirm('Would you like to notify the attendees about this cancellation?');

            const success = await deleteMeeting(meetingId, notifyAttendees);

            if (success) {
                // Meetings list is automatically updated in the hook
            }
        }
    };

    const getMeetingStatusClass = (meeting: MeetingData): string => {
        if (meeting.status === 'cancelled') return 'cancelled';

        const now = new Date();
        const start = new Date(meeting.start.dateTime);
        const end = new Date(meeting.end.dateTime);

        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'in-progress';
        return 'past';
    };

    if (loading && meetings.length === 0) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center space-x-4">
                    <label className="text-gray-700 font-medium">Show meetings:</label>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'upcoming' | 'past' | 'all')}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="all">All</option>
                    </select>
                </div>

                <button
                    onClick={loadMeetings}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {meetings.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No meetings found. Create a new meeting to get started.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {meetings.map((meeting) => {
                            const statusClass = getMeetingStatusClass(meeting);
                            return (
                                <div
                                    key={meeting.id}
                                    className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md 
                    ${statusClass === 'cancelled' ? 'opacity-60 bg-gray-50' : ''}
                    ${statusClass === 'in-progress' ? 'border-green-300 bg-green-50' : ''}
                    ${statusClass === 'upcoming' ? 'border-blue-300 bg-blue-50' : ''}
                    ${statusClass === 'past' && statusClass !== 'cancelled' ? 'border-gray-200' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-medium text-gray-800 truncate mr-2">{meeting.summary}</h3>
                                        <button
                                            className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                                            onClick={() => handleDeleteMeeting(meeting.id)}
                                            aria-label="Delete meeting"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-3">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <span>{formatMeetingTime(meeting.start.dateTime, meeting.start.timeZone)}</span>
                                            {meeting.end && (
                                                <span className="ml-1 text-gray-500">
                                                    ({calculateDuration(meeting.start.dateTime, meeting.end.dateTime)})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {meeting.description && (
                                        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {meeting.description}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {statusClass === 'in-progress' && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                In progress
                                            </span>
                                        )}
                                        {statusClass === 'upcoming' && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                Upcoming
                                            </span>
                                        )}
                                        {statusClass === 'cancelled' && (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                                Cancelled
                                            </span>
                                        )}
                                        {statusClass === 'past' && !meeting.status && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                                Past
                                            </span>
                                        )}

                                        {meeting.attendees && meeting.attendees.length > 0 && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                {meeting.attendees.length} {meeting.attendees.length === 1 ? 'attendee' : 'attendees'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {meeting.meetLink && (
                                            <a
                                                href={meeting.meetLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm text-center rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                            >
                                                <span className="flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                                        <path d="M8 8a1 1 0 00-1 1v2a1 1 0 001 1h4a1 1 0 001-1V9a1 1 0 00-1-1H8z" />
                                                    </svg>
                                                    Join Meeting
                                                </span>
                                            </a>
                                        )}

                                        <div className="flex gap-2">
                                            {onViewDetails && (
                                                <button
                                                    onClick={() => onViewDetails(meeting)}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                >
                                                    Details
                                                </button>
                                            )}

                                            {onEditMeeting && (
                                                <button
                                                    onClick={() => onEditMeeting(meeting)}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {nextPageToken && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

interface MeetingFormProps {
    accountId: string;
    meetingToEdit?: MeetingData;
    onSuccess?: (meeting: MeetingData) => void;
    onCancel?: () => void;
}

const MeetingForm: React.FC<MeetingFormProps> = ({
    accountId,
    meetingToEdit,
    onSuccess,
    onCancel
}) => {
    const { createMeeting, updateMeeting, loading, error } = useMeetApi(accountId);

    // Initialize with defaults or existing meeting data
    const [formData, setFormData] = useState<MeetingFormData>({
        summary: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().slice(0, 5),
        endDate: new Date().toISOString().split('T')[0],
        endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5), // 1 hour later
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendees: '',
        notifyAttendees: true,
        guestsCanModify: false,
        guestsCanInviteOthers: true,
        guestsCanSeeOtherGuests: true
    });

    // Populate form if editing an existing meeting
    useEffect(() => {
        if (meetingToEdit) {
            const startDate = new Date(meetingToEdit.start.dateTime);
            const endDate = new Date(meetingToEdit.end.dateTime);

            setFormData({
                summary: meetingToEdit.summary || '',
                description: meetingToEdit.description || '',
                startDate: startDate.toISOString().split('T')[0],
                startTime: startDate.toTimeString().slice(0, 5),
                endDate: endDate.toISOString().split('T')[0],
                endTime: endDate.toTimeString().slice(0, 5),
                timeZone: meetingToEdit.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                attendees: meetingToEdit.attendees?.map(a => a.email).join(', ') || '',
                notifyAttendees: true,
                guestsCanModify: meetingToEdit.guestsCanModify || false,
                guestsCanInviteOthers: meetingToEdit.guestsCanInviteOthers !== false, // Default to true
                guestsCanSeeOtherGuests: meetingToEdit.guestsCanSeeOtherGuests !== false // Default to true
            });
        }
    }, [meetingToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Convert form data to API parameters
            const meetingParams = formToMeetingParams(formData);

            let result: MeetingData | null;

            if (meetingToEdit) {
                // Update existing meeting
                result = await updateMeeting(meetingToEdit.id, meetingParams);
            } else {
                // Create new meeting
                result = await createMeeting(meetingParams);
            }

            if (result && onSuccess) {
                onSuccess(result);
            }
        } catch (err) {
            console.error('Error saving meeting:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{meetingToEdit ? 'Edit Meeting' : 'Create New Meeting'}</h2>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Meeting Title*</label>
                    <input
                        type="text"
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        required
                        placeholder="Enter meeting title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter meeting description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time*</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time*</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                    <select
                        id="timeZone"
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {COMMON_TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">Attendees (comma-separated emails)</label>
                    <input
                        type="text"
                        id="attendees"
                        name="attendees"
                        value={formData.attendees}
                        onChange={handleChange}
                        placeholder="email1@example.com, email2@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Meeting Options</div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="notifyAttendees"
                            name="notifyAttendees"
                            checked={formData.notifyAttendees}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notifyAttendees" className="ml-2 block text-sm text-gray-700">
                            Notify attendees
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="guestsCanModify"
                            name="guestsCanModify"
                            checked={formData.guestsCanModify}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="guestsCanModify" className="ml-2 block text-sm text-gray-700">
                            Guests can modify
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="guestsCanInviteOthers"
                            name="guestsCanInviteOthers"
                            checked={formData.guestsCanInviteOthers}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="guestsCanInviteOthers" className="ml-2 block text-sm text-gray-700">
                            Guests can invite others
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="guestsCanSeeOtherGuests"
                            name="guestsCanSeeOtherGuests"
                            checked={formData.guestsCanSeeOtherGuests}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="guestsCanSeeOtherGuests" className="ml-2 block text-sm text-gray-700">
                            Guests can see other guests
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {loading
                        ? (meetingToEdit ? 'Updating...' : 'Creating...')
                        : (meetingToEdit ? 'Update Meeting' : 'Create Meeting')}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

interface MeetingDetailsProps {
    accountId: string;
    meetingId: string;
    onBack?: () => void;
}

const MeetingDetails: React.FC<MeetingDetailsProps> = ({
    accountId,
    meetingId,
    onBack
}) => {
    const {
        meeting,
        loading,
        error,
        getMeeting,
        addParticipant,
        removeParticipant,
        checkAvailability
    } = useMeetApi(accountId);

    const [newParticipantEmail, setNewParticipantEmail] = useState('');
    const [isOptional, setIsOptional] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    useEffect(() => {
        // Load meeting details when component mounts
        getMeeting(meetingId);
    }, [getMeeting, meetingId]);

    const handleAddParticipant = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newParticipantEmail.trim()) return;

        const result = await addParticipant(
            meetingId,
            newParticipantEmail,
            isOptional
        );

        if (result) {
            setNewParticipantEmail('');
            setIsOptional(false);
            setIsAvailable(null);
        }
    };

    const handleRemoveParticipant = async (email: string) => {
        if (window.confirm(`Remove ${email} from this meeting?`)) {
            await removeParticipant(meetingId, email);
        }
    };

    const handleCheckAvailability = async () => {
        if (!newParticipantEmail.trim() || !meeting) return;

        setCheckingAvailability(true);

        const available = await checkAvailability(
            newParticipantEmail,
            meeting.start.dateTime,
            meeting.end.dateTime
        );

        setIsAvailable(available);
        setCheckingAvailability(false);
    };

    if (loading && !meeting) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    if (!meeting) {
        return <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">Meeting not found</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                {onBack && (
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                        onClick={onBack}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Meetings
                    </button>
                )}
                <h2 className="text-2xl font-bold text-gray-800">{meeting.summary}</h2>
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Date & Time</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{formatMeetingTime(meeting.start.dateTime, meeting.start.timeZone)}</span>
                        </div>
                        <div className="hidden sm:block text-gray-500">to</div>
                        <div className="flex items-center text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>{formatMeetingTime(meeting.end.dateTime, meeting.end.timeZone)}</span>
                        </div>
                    </div>
                </div>

                {meeting.description && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-line">{meeting.description}</p>
                    </div>
                )}

                {meeting.meetLink && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Meeting Link</h3>
                        <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            Join Google Meet
                        </a>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Participants</h3>

                    {/* Form to add new participants */}
                    <form onSubmit={handleAddParticipant} className="mb-6 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                                <input
                                    type="email"
                                    value={newParticipantEmail}
                                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleCheckAvailability}
                                disabled={!newParticipantEmail.trim() || checkingAvailability}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                {checkingAvailability ? 'Checking...' : 'Check Availability'}
                            </button>
                        </div>

                        {isAvailable !== null && (
                            <div className={`p-2 rounded-md ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {isAvailable
                                    ? 'Available at this time'
                                    : 'Not available at this time'}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isOptional"
                                    checked={isOptional}
                                    onChange={(e) => setIsOptional(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isOptional" className="ml-2 block text-sm text-gray-700">
                                    Optional attendee
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !newParticipantEmail.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {loading ? 'Adding...' : 'Add Participant'}
                            </button>
                        </div>
                    </form>

                    {/* List of participants */}
                    <div className="space-y-2">
                        {meeting.organizer && (
                            <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                                        {meeting.organizer.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{meeting.organizer.email}</div>
                                        <div className="text-sm text-blue-800">Organizer</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {meeting.attendees?.map((attendee, index) => (
                            <div key={index} className="border border-gray-200 p-3 rounded-md flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-bold mr-3">
                                        {attendee.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium">{attendee.email}</div>
                                        <div className="flex items-center gap-2">
                                            {attendee.optional && (
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                                                    Optional
                                                </span>
                                            )}
                                            <span className={`text-xs px-2 py-0.5 rounded-full
                        ${attendee.responseStatus === 'accepted' ? 'bg-green-100 text-green-800' : ''}
                        ${attendee.responseStatus === 'declined' ? 'bg-red-100 text-red-800' : ''}
                        ${attendee.responseStatus === 'tentative' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${(!attendee.responseStatus || attendee.responseStatus === 'needsAction') ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                                                {attendee.responseStatus === 'accepted' && 'Accepted'}
                                                {attendee.responseStatus === 'declined' && 'Declined'}
                                                {attendee.responseStatus === 'tentative' && 'Tentative'}
                                                {(!attendee.responseStatus || attendee.responseStatus === 'needsAction') && 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemoveParticipant(attendee.email)}
                                    className="text-red-600 hover:text-red-800 focus:outline-none"
                                    title="Remove participant"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        {(!meeting.attendees || meeting.attendees.length === 0) && (
                            <p className="text-gray-500 text-center py-2 bg-gray-50 rounded-md">
                                No additional participants
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MeetingsAppProps {
    accountId: string;
}

type AppView = 'list' | 'create' | 'edit' | 'details';

const MeetingsApp: React.FC<MeetingsAppProps> = ({ accountId }) => {
    const [currentView, setCurrentView] = useState<AppView>('list');
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingData | undefined>();

    const handleCreateMeeting = () => {
        setSelectedMeeting(undefined);
        setCurrentView('create');
    };

    const handleEditMeeting = (meeting: MeetingData) => {
        setSelectedMeeting(meeting);
        setCurrentView('edit');
    };

    const handleViewDetails = (meeting: MeetingData) => {
        setSelectedMeeting(meeting);
        setCurrentView('details');
    };

    const handleMeetingCreated = (meeting: MeetingData) => {
        setSelectedMeeting(meeting);
        setCurrentView('details');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedMeeting(undefined);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Google Meet Manager</h1>
                    <div>
                        {currentView === 'list' ? (
                            <button
                                onClick={handleCreateMeeting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Create New Meeting
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={handleBackToList}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    Back to Meetings
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {currentView === 'list' && (
                    <MeetingsList
                        accountId={accountId}
                        onEditMeeting={handleEditMeeting}
                        onViewDetails={handleViewDetails}
                    />
                )}

                {(currentView === 'create' || currentView === 'edit') && (
                    <MeetingForm
                        accountId={accountId}
                        meetingToEdit={currentView === 'edit' ? selectedMeeting : undefined}
                        onSuccess={handleMeetingCreated}
                        onCancel={handleBackToList}
                    />
                )}

                {currentView === 'details' && selectedMeeting && (
                    <MeetingDetails
                        accountId={accountId}
                        meetingId={selectedMeeting.id}
                        onBack={handleBackToList}
                    />
                )}
            </div>
        </div>
    );
};

const GoogleMeetApi: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { currentAccount } = useAccount();

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">Google Meet Manager</h1>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {isAuthenticated && currentAccount?.id ? (
                    <MeetingsApp accountId={currentAccount.id} />
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
                        <p className="text-gray-600">Please sign in to access your Meet meetings.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GoogleMeetApi;