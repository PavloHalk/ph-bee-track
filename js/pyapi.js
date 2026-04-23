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
    console.log(result);
    
    if (result.status && result.status === 'error') {
        console.warn(sql);
        throw new SqliteError(result.message);
    }
    
    return result;
}

export async function loadHtml(path) {
    const result = await pywebview.api.load_html_content(path);

    if (result.status && result.status === 'error') throw new SqliteError(result.message);
    
    return result.content;
}

export async function saveConfig(config) {
    await pywebview.api.save_config(JSON.stringify(config));
}

export async function loadConfig() {
    const config = await pywebview.api.load_config();
    
    return JSON.parse(config);
}

class SqliteError extends Error {
    name = 'SqliteError';
}