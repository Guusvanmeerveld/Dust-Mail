const accessToken = JSON.parse(`{{access_token}}`);
const refreshToken = JSON.parse(`{{refresh_token}}`);
const username = "{{username}}";

document.getElementById("text").innerHTML = "Logging in, please wait...";

if ("__TAURI__" in window) {
	window.__TAURI__.tauri.invoke("oauth_login_token", {
		config: JSON.stringify({
			tokens: [accessToken, refreshToken],
			username
		})
	});
} else if ("opener" in window && "postMessage" in window.opener) {
	window.opener.postMessage(
		JSON.stringify({ tokens: [accessToken, refreshToken], username }),
		"{{clientHostname}}"
	);

	document.getElementById("text").innerHTML =
		"Login complete, you can now close this window.";
} else {
	document.getElementById("text").innerHTML =
		"Thats weird, your browser does not support communication between browser windows. Please upgrade your browser or use another one.";
}
