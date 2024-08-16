const puppeteer = require('puppeteer');
const accountSid = 'AC1076b49de4ea1295cdb1722e4beaa585';
const authToken = 'f7d1c32c8265f3676cf1649837b7fa9c';
const client = require('twilio')(accountSid, authToken);

const fetchJobs = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://hiring.amazon.ca/app#/jobSearch', { waitUntil: 'networkidle2' });

    // Wait for the job elements to be present
    await page.waitForSelector('div > strong');

    const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll('div > strong');
        const jobTitles = [];
        jobElements.forEach(jobElement => {
            const title = jobElement.innerText.trim();
            if ((title.includes("Montreal") || title.includes("Associate"))) {
                jobTitles.push(title);
            }
        });

        const filteredJobs = [];
        for (let i = 1; i < jobTitles.length; i++) {
            if (jobTitles[i].includes("Montreal")) {
                filteredJobs.push(jobTitles[i - 1]);
                filteredJobs.push(jobTitles[i]);
            }
        }
        
        return filteredJobs;
    });

    await browser.close();
    return jobs;
};

const sendWhatsAppMessage = (jobs) => {
    client.messages
        .create({
            body: `Jobs are open: \n${jobs.join('\n')}\nCheck out the website.`,
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+14387798643'
        })
        .then(message => console.log(`Message sent with SID: ${message.sid}`))
        .catch(error => console.error('Error sending WhatsApp message:', error));
};

const checkJobs = () => {
    fetchJobs()
        .then(jobs => {
            if (jobs.length > 0) {
                console.log('Jobs found:', jobs);
                sendWhatsAppMessage(jobs);  // Send WhatsApp message if jobs found
            } else {
                console.log('No relevant jobs found.');
            }
        })
        .catch(error => console.error());
};

// Run the checkJobs function every 10 seconds
setInterval(checkJobs, 120000);
