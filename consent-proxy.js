// netlify/functions/consent-proxy.js
//
// This function runs on Netlify's servers, not in the browser, so the
// Securiti.ai API key/secret/tenant ID never reach the client. Configure
// these three values as Environment Variables in the Netlify dashboard
// (Site configuration > Environment variables) - do NOT hard-code them here
// or commit them to GitHub:
//
//   SECURITI_API_KEY
//   SECURITI_API_SECRET
//   SECURITI_TIDENT
//
// The GitHub Pages form calls this function's URL instead of calling
// Securiti.ai directly.

exports.handler = async function (event) {
    // Basic CORS handling so the GitHub Pages origin can call this function
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (err) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    const apiKey = process.env.SECURITI_API_KEY;
    const apiSecret = process.env.SECURITI_API_SECRET;
    const tident = process.env.SECURITI_TIDENT;

    if (!apiKey || !apiSecret || !tident) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Server is missing Securiti.ai credentials. Set SECURITI_API_KEY, SECURITI_API_SECRET and SECURITI_TIDENT in Netlify environment variables.' })
        };
    }

    try {
        const securitiResponse = await fetch('https://app.securiti.ai/privaci/v1/consentapi/consent_upload', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'X-API-Secret': apiSecret,
                'X-TIDENT': tident,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await securitiResponse.text();

        return {
            statusCode: securitiResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: responseText
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to reach Securiti.ai', details: err.message })
        };
    }
};
