import localForage from 'localforage';

const filesStore = localForage.createInstance({
    name: 'fileStorage',
    storeName: 'uploadedFiles',
});

export default filesStore;