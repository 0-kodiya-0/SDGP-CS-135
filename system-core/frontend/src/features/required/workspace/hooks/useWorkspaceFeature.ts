import { useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
    WorkspaceFeatureType,
    WorkspaceContent,
    ShareContentRequest
} from '../types/workspace.types';

/**
 * Hook for feature-specific workspace operations
 * 
 * @param featureType The type of feature to operate on
 */
export const useWorkspaceFeature = (featureType: WorkspaceFeatureType) => {
    const {
        selectedWorkspace,
        contents,
        loading,
        error,
        fetchContents,
        shareContent,
        removeContent
    } = useWorkspace();

    /**
     * Fetch contents for the specific feature
     */
    const fetchFeatureContents = useCallback(async () => {
        if (!selectedWorkspace) return;
        await fetchContents(selectedWorkspace.id, featureType);
    }, [selectedWorkspace, fetchContents, featureType]);

    /**
     * Share content to the workspace for this feature
     */
    const shareFeatureContent = useCallback(async (
        contentId: string,
        metadata: Record<string, any>
    ): Promise<WorkspaceContent | null> => {
        if (!selectedWorkspace) return null;

        const request: ShareContentRequest = {
            contentId,
            contentType: featureType,
            metadata
        };

        return shareContent(selectedWorkspace.id, request);
    }, [selectedWorkspace, shareContent, featureType]);

    /**
     * Remove content from the workspace for this feature
     */
    const removeFeatureContent = useCallback(async (
        contentId: string
    ): Promise<boolean> => {
        if (!selectedWorkspace) return false;
        return removeContent(selectedWorkspace.id, contentId);
    }, [selectedWorkspace, removeContent]);

    /**
     * Get feature-specific contents
     */
    const getFeatureContents = useCallback((): WorkspaceContent[] => {
        return contents.filter(content => content.contentType === featureType);
    }, [contents, featureType]);

    /**
     * Check if a specific content is shared to the workspace
     */
    const isContentShared = useCallback((contentId: string): boolean => {
        return contents.some(content =>
            content.contentType === featureType && content.contentId === contentId
        );
    }, [contents, featureType]);

    /**
     * Get shared content by original content ID
     */
    const getSharedContent = useCallback((contentId: string): WorkspaceContent | undefined => {
        return contents.find(content =>
            content.contentType === featureType && content.contentId === contentId
        );
    }, [contents, featureType]);

    /**
     * Check if the feature is enabled in the workspace
     */
    const isFeatureEnabled = useCallback((): boolean => {
        if (!selectedWorkspace) return false;

        const feature = selectedWorkspace.features.find(f => f.type === featureType);
        return !!feature && feature.enabled;
    }, [selectedWorkspace, featureType]);

    return {
        isFeatureEnabled,
        featureContents: getFeatureContents(),
        featureType,
        workspaceId: selectedWorkspace?.id,
        loading,
        error,
        fetchFeatureContents,
        shareFeatureContent,
        removeFeatureContent,
        isContentShared,
        getSharedContent
    };
};