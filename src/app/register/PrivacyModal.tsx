interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    scrolledToBottom: boolean;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export default function PrivacyModal({ isOpen, onClose, onAccept, scrolledToBottom, onScroll }: PrivacyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-green-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
                        <p className="text-sm text-gray-600 mt-1">How we protect and use your data</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>
                
                <div 
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                    onScroll={onScroll}
                >
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <p className="text-sm text-gray-800">
                            <strong>Last Updated:</strong> November 11, 2025
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                            This Privacy Policy describes how AgileMind collects, uses, and shares your personal information when you use our services.
                        </p>
                    </div>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">1</span>
                            Information We Collect
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We collect several types of information to provide and improve our Service:
                        </p>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Personal Information</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                                    <li>Name, email address, and contact information</li>
                                    <li>Company information and job title</li>
                                    <li>Billing and payment information</li>
                                    <li>Account credentials and authentication data</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Usage Information</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                                    <li>Log data including IP address, browser type, and device information</li>
                                    <li>Pages visited, time spent on pages, and clickstream data</li>
                                    <li>Features used and interaction patterns</li>
                                    <li>Project data, tasks, and collaboration activity</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Communication Data</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                                    <li>Messages and content you send through our platform</li>
                                    <li>Comments, feedback, and support requests</li>
                                    <li>Email communications and notifications</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">2</span>
                            How We Use Your Information
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We use the information we collect for various purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>To provide, maintain, and improve our services</li>
                            <li>To process transactions and send related information</li>
                            <li>To send technical notices, updates, and support messages</li>
                            <li>To respond to your comments, questions, and customer service requests</li>
                            <li>To communicate with you about products, services, and events</li>
                            <li>To monitor and analyze trends, usage, and activities</li>
                            <li>To detect, prevent, and address technical issues and security threats</li>
                            <li>To personalize and improve your experience</li>
                            <li>To facilitate collaboration and communication within your organization</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">3</span>
                            Information Sharing and Disclosure
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We do not sell your personal information. We may share your information in the following circumstances:
                        </p>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">With Your Consent</h4>
                                <p className="text-sm text-gray-700 ml-4">
                                    We may share your information with third parties when you give us explicit permission to do so.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Service Providers</h4>
                                <p className="text-sm text-gray-700 ml-4">
                                    We work with third-party service providers who perform services on our behalf, such as hosting, data analysis, payment processing, and customer service. These providers have access to your information only to perform specific tasks and are obligated to protect your information.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Legal Requirements</h4>
                                <p className="text-sm text-gray-700 ml-4">
                                    We may disclose your information if required by law or in response to valid requests by public authorities.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm mb-2">Business Transfers</h4>
                                <p className="text-sm text-gray-700 ml-4">
                                    If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">4</span>
                            Data Security
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We implement appropriate technical and organizational security measures to protect your personal information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>Industry-standard encryption for data in transit and at rest</li>
                            <li>Regular security assessments and penetration testing</li>
                            <li>Access controls and authentication mechanisms</li>
                            <li>Employee training on data protection and security best practices</li>
                            <li>Incident response procedures and breach notification protocols</li>
                            <li>Regular backups and disaster recovery plans</li>
                        </ul>
                        <p className="text-sm text-gray-700 leading-relaxed mt-3">
                            While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">5</span>
                            Your Privacy Rights
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            Depending on your location, you may have the following rights regarding your personal information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li><strong>Access:</strong> Request access to your personal information</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                            <li><strong>Objection:</strong> Object to processing of your personal information</li>
                            <li><strong>Restriction:</strong> Request restriction of processing your data</li>
                            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
                        </ul>
                        <p className="text-sm text-gray-700 leading-relaxed mt-3">
                            To exercise these rights, please contact us at privacy@agilemind.com. We will respond to your request within 30 days.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">6</span>
                            Data Retention
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. We will retain and use your information to the extent necessary to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>Comply with legal obligations</li>
                            <li>Resolve disputes and enforce agreements</li>
                            <li>Maintain business records and analytics</li>
                        </ul>
                        <p className="text-sm text-gray-700 leading-relaxed mt-3">
                            When your account is deleted, we will delete or anonymize your personal information within 90 days, except where retention is required by law.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">7</span>
                            Cookies and Tracking Technologies
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We use cookies and similar tracking technologies to track activity on our Service and hold certain information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li><strong>Essential Cookies:</strong> Required for the operation of our Service</li>
                            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our Service</li>
                            <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
                        </ul>
                        <p className="text-sm text-gray-700 leading-relaxed mt-3">
                            You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, some parts of our Service may not function properly without cookies.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">8</span>
                            International Data Transfers
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">9</span>
                            Children's Privacy
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                        </p>
                    </section>

                    <section className="pb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm">10</span>
                            Contact Us
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700"><strong>Privacy Team Email:</strong> privacy@agilemind.com</p>
                            <p className="text-sm text-gray-700"><strong>Data Protection Officer:</strong> dpo@agilemind.com</p>
                            <p className="text-sm text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
                            <p className="text-sm text-gray-700"><strong>Address:</strong> 123 Business Street, Suite 100, San Francisco, CA 94105</p>
                        </div>
                    </section>

                    {!scrolledToBottom && (
                        <div className="sticky bottom-0 left-0 right-0 bg-linear-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
                            <p className="text-sm text-green-600 font-semibold animate-bounce">
                                ↓ Scroll down to continue ↓
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="p-5 border-t border-gray-200 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-white font-semibold text-sm transition-colors"
                    >
                        Disagree & Close
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={!scrolledToBottom}
                        className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                            scrolledToBottom
                                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {scrolledToBottom ? 'I Agree - Accept Policy' : 'Scroll to Accept'}
                    </button>
                </div>
            </div>
        </div>
    );
}
