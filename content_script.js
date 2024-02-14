(async () => {
	const downloadButtonId = '65cc5d095a58054d910b2b63';

	function findByXPath(xpath) {
		return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
	}

	function isAllurePageLoaded() {
		const allureLogoButton = '//a[@class="SideMenu__logo" and @title="allure" and @data-testid="link__logo"]';
		return null !== findByXPath(allureLogoButton);
	}

	function isLaunchPageLoaded() {
		const launchesBreadcrumb = '//div[@class="LaunchHeader"]/div[@class="BreadCrumbs "]/a[@title="Launches"]';
		return null !== findByXPath(launchesBreadcrumb);
	}

	function repeatUntil(callback, interval) {
		return new Promise((resolve, reject) => {
			if (callback()) {
				return;
			}

			const subscription = window.setInterval(
				() => {
					if (callback()) {
						window.clearInterval(subscription);
						resolve();
					}
				},
				interval ?? 1000);
		});
	}

	function waitCondition(condition, timeout, interval) {
		return new Promise((resolve, reject) => {
			const conditionResult = condition();
			if (conditionResult) {
				resolve(conditionResult);
				return;
			}
	
			timeout ??= 10000;
			interval ??= 100;
	
			const subscription = window.setInterval(
				() => {
					const conditionResult = condition();
					if (conditionResult) {
						window.clearInterval(subscription);
						resolve(conditionResult);
						return;
					}
	
					timeout -= interval;
	
					if (timeout <= 0) {
						window.clearInterval(subscription);
						resolve(conditionResult);
					}
				},
				interval);
			});
	}

	function isDownloadButtonAdded() {
		return null !== document.getElementById(downloadButtonId);
	}

	function addDownloadButton() {
		const launchButtonsContainerXpath = '//div[@class="LaunchHeader"]/div[@class="Gapped Gapped_small Gapped_align_center "]';
		const launchButtonsContainer = findByXPath(launchButtonsContainerXpath);

		if (launchButtonsContainer !== null) {
			const button = document.createElement('button');
			button.id = downloadButtonId;
			button.type = 'button';
			button.title = 'Download VS test playlist';
			button.className = 'Button Button_size_tiny Button_style_default Button_shape_round ';
			button.innerHTML = '<svg class="Icon Icon_size_small Button__icon Button__icon_size_tiny" viewBox="0 0 32 32" name=""><use xlink:href="#list-dropdown"></use></svg>';
			button.onclick = generateVSPlaylist;

			launchButtonsContainer.prepend(button);
		}
	}

	function asyncRequest(url) {
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(JSON.parse(xhr.response));
				} else {
					reject({ status: this.status, statusText: xhr.statusText });
				}
			};
			xhr.onerror = () => reject({ status: this.status, statusText: xhr.statusText });
			xhr.send();
		});
	}

	async function generateVSPlaylist() {
		const launchIdRegexp = /\/launch\/(\d+)/;
		const locationMatch = location.pathname.match(launchIdRegexp);
		const launchId = locationMatch[1];

		const unresolvedTestsData = await asyncRequest(`${location.origin}/api/rs/launch/${launchId}/unresolved?page=0&size=500`);
		const unresolvedTestIds = unresolvedTestsData.content.map((test) => test.id);
		const testFullNames = [];

		for (let i = 0; i < unresolvedTestIds.length; i++) {
			const unresolvedTestData = await asyncRequest(`${location.origin}/api/rs/testresult/${unresolvedTestIds[i]}`);
			testFullNames.push(unresolvedTestData.fullName);
		}

		const playlistData = '<Playlist Version="1.0">\n' + testFullNames.map((test) => `<Add Test="${test.replace(/"/g, '&quot;')}"/>\n`).join('')  + '</Playlist>';
		const link = document.createElement('a');
		link.href = 'data:application/xspf+xml;charset=utf-8,' + escape(playlistData);
		link.download = "failed_tests.playlist";
		link.click();
	}

	if (await waitCondition(isAllurePageLoaded)) {
		console.log('Allure extension loaded');

		const allurePageMaxUnloadedCount = 5;
		var allurePageUnloadedCount = 0;

		await repeatUntil(() => {
			if (isAllurePageLoaded()) {
				allurePageUnloadedCount = 0;
			} else {
				allurePageUnloadedCount++;

				if (allurePageUnloadedCount >= allurePageMaxUnloadedCount) {
					return true;
				}
			}

			if (!isDownloadButtonAdded() && isLaunchPageLoaded()) {
				addDownloadButton();
			}
		});

		console.log('Allure extension unloaded')
	}
})();