const TYPE_URLS = {
  report_returned: '/#/reports',
  plan_returned: '/#/lesson-plans',
  evaluation_done: '/#/reports',
  recognition: '/#/recognition'
};

self.addEventListener('push', (event) => {
  let data = { title: 'سامانه مربی', body: '', type: '' };
  try {
    if (event.data) data = Object.assign(data, JSON.parse(event.data.text()));
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || undefined,
      tag: data.tag || data.type || undefined,
      dir: 'rtl',
      lang: 'fa-IR',
      data: { url: TYPE_URLS[data.type] || '/#/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/#/';
  event.waitUntil(self.clients.openWindow(url));
});
