import { usePage as usePageHook } from '@inertiajs/react';

export type ShareType = {
    code: string;
    hash: string;
    multisite: boolean;
    php_version: string;
    wordpress_version: string;
};

export type PageProps = {
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
