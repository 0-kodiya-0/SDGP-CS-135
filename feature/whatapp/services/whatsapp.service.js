const axios = require("axios");

class WhatsappService {
    constructor(){
        this.apiKey = process.env.WHATSAPP_API_KEY;
        this.baseUrl = process.env.WHATSAPP_BASE_URL;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }


    async sendTextMessage(recipientNumber, message) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: recipientNumber,
                    type: "text",
                    text: {
                        body: message
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    async markMessageAsRead(messageId) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Failed to mark message as read: ${error.message}`);
        }
    }

    async handleWebhook(req, res) {
        try {
            const { entry } = req.body;
            
            if (entry?.[0]?.changes?.[0]?.value?.messages) {
                const message = entry[0].changes[0].value.messages[0];
                
                // Process the message here
                console.log('Received message:', message);
                
                // Send acknowledgment back to WhatsApp
                res.status(200).send('OK');
            } else {
                res.status(200).send('OK');
            }
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({ error: error.message });
        }
    }

   
    verifyWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
                res.status(200).send(challenge);
            } else {
                res.status(403).json({ error: 'Verification failed' });
            }
        }
    }
}

module.exports = WhatsAppService;