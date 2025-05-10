// src/features/default/files/utils/registerFilesComponents.ts
import { registerComponent } from '../../../required/tab_view/utils/componentRegistry';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

/**
 * Register all files-related components for dynamic loading
 * This function should be called during application initialization
 */
export function registerFilesComponents() {
  // Register files components using the extended ComponentTypes enum
  registerComponent(
    ComponentTypes.FILES_SUMMARY_VIEW, 
    () => import('../components/FilesSummaryView')
  );
  
  registerComponent(
    ComponentTypes.FILES_DETAIL_VIEW, 
    () => import('../components/FilesDetailView')
  );
  
//   registerComponent(
//     ComponentTypes.FILES_FILE_UPLOAD_COMPONENT, 
//     () => import('../components/UploadComponent')
//   );
  
//   registerComponent(
//     ComponentTypes.FILES_FILE_CREATE_FILE, 
//     () => import('../components/CreateFile')
//   );
  
//   registerComponent(
//     ComponentTypes.FILES_FILE_SEARCH_BAR, 
//     () => import('../components/SearchBar')
//   );

  console.log('Files components registered for dynamic loading');
}