const pywebviewWaiter = new Promise((resolve, reject) => {
    if (window.pywebview) resolve(true);

    if (navigator.userAgent === 'pywebview-client') {
        window.addEventListener('pywebviewready', () => {
            if (window.pywebview) {
                resolve(true);
            } else {
                reject(new Error('Unexpected error on initializing pywebview.'));
            }
        });
    } else {
        reject(new Error('Unable to initiate pywebview.'));
    }
});

await pywebviewWaiter;

export async function executeSql(sql) {
    const result = await pywebview.api.execute_sql(sql);
    
    if (result.status && result.status === 'error') throw new SqliteError(result.message);
    
    return result;
}

export async function loadHtml(path) {
    const result = await pywebview.api.load_html_content(path);

    if (result.status && result.status === 'error') throw new SqliteError(result.message);
    
    return result.content;
}

class SqliteError extends Error {
    name = 'SqliteError';
}