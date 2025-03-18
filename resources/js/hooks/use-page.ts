import { usePage as usePageHook } from '@inertiajs/react';

export type ShareType = {
    hash: string;
    code: string;
    wordpress_version: string;
    php_version: string;
};

export type PageProps = {
    created?: boolean;
    /* https://github.com/spatie/laravel-honeypot */
    honeypot: {
        enabled: boolean;
        encryptedValidFrom: string;
        nameFieldName: string;
        unrandomizedNameFieldName: string;
        validFromFieldName: string;
    };
    share?: ShareType;
    url?: string;
};

export const usePage = () => usePageHook<PageProps>();
