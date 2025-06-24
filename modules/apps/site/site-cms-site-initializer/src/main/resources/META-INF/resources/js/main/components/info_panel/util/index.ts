

export function getBaseAssetInfo({
    embedded: {
        title,
        objectEntryFolderExternalReferenceCode = ''
    },
    entryClassName = '',
}: any) {
    const baseAssetInfo: any = {name: title};

    if (entryClassName.includes('ObjectEntryFolder')) {
        baseAssetInfo.icon = 'folder';
        baseAssetInfo.type = 'folder';
    }
    else if (objectEntryFolderExternalReferenceCode === 'L_FILES') {
        baseAssetInfo.icon = 'document-image';
        baseAssetInfo.type = 'files';
    }
    else if (objectEntryFolderExternalReferenceCode === 'L_CONTENTS') {
        baseAssetInfo.icon = 'forms';
        baseAssetInfo.type = 'contents';
    }

    return baseAssetInfo;
}