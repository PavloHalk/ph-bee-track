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

class SqliteError extends Error {
    name = 'SqliteError';
}