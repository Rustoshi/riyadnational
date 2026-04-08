'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function LiveChatWidget() {
    const pathname = usePathname();

    // Don't render on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <Script
                id="smartsupp-chat"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        var _smartsupp = _smartsupp || {};
                        _smartsupp.key = '543969ac0329d79efc76e9eacb50caffa28765b8';
                        window.smartsupp||(function(d) {
                            var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
                            s=d.getElementsByTagName('script')[0];c=d.createElement('script');
                            c.type='text/javascript';c.charset='utf-8';c.async=true;
                            c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
                        })(document);
                    `,
                }}
            />
            <noscript>
                Powered by <a href="https://www.smartsupp.com" target="_blank" rel="noopener noreferrer">Smartsupp</a>
            </noscript>
        </>
    );
}
