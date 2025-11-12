interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    scrolledToBottom: boolean;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export default function TermsModal({ isOpen, onClose, onAccept, scrolledToBottom, onScroll }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-blue-50 to-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
                        <p className="text-sm text-gray-600 mt-1">Please read carefully before accepting</p>
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
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">1</span>
                            Acceptance of Terms
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            By accessing and using the AgileMind Platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            This Terms of Service agreement is effective as of the date you first use the Service and continues until terminated in accordance with its terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">2</span>
                            Use License
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            Permission is granted to temporarily access and use the AgileMind Platform for personal and commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose without authorization</li>
                            <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">3</span>
                            Service Description
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            AgileMind provides a comprehensive project management and collaboration platform designed for agile teams. Our services include but are not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>Project planning and tracking tools</li>
                            <li>Team collaboration features including real-time messaging and file sharing</li>
                            <li>Sprint management and backlog organization</li>
                            <li>Reporting and analytics dashboards</li>
                            <li>Integration with third-party tools and services</li>
                            <li>Role-based access control and security features</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">4</span>
                            User Responsibilities
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            As a user of the AgileMind Platform, you are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                            <li>Maintaining the confidentiality of your account and password</li>
                            <li>Restricting access to your computer and account</li>
                            <li>Accepting responsibility for all activities that occur under your account</li>
                            <li>Ensuring that all information you provide is accurate and up-to-date</li>
                            <li>Complying with all applicable laws and regulations</li>
                            <li>Not using the service for any unlawful or prohibited activities</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">5</span>
                            Payment Terms
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            Subscription fees are billed in advance on a monthly or annual basis depending on your chosen plan. All fees are non-refundable unless otherwise stated in our refund policy.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            You authorize us to charge your payment method on a recurring basis without requiring your prior approval for each recurring charge until you notify us of your cancellation.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            We reserve the right to change our pricing with 30 days advance notice. Price changes will not affect your current billing cycle.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">6</span>
                            Intellectual Property Rights
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            The Service and its original content, features, and functionality are owned by AgileMind and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            You retain all rights to the data and content you upload to the platform. By uploading content, you grant us a license to use, store, and display that content as necessary to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">7</span>
                            Termination
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">8</span>
                            Limitation of Liability
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            In no event shall AgileMind, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>

                    <section className="pb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm">9</span>
                            Contact Information
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700"><strong>Email:</strong> legal@agilemind.com</p>
                            <p className="text-sm text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
                            <p className="text-sm text-gray-700"><strong>Address:</strong> 123 Business Street, Suite 100, San Francisco, CA 94105</p>
                        </div>
                    </section>

                    {!scrolledToBottom && (
                        <div className="sticky bottom-0 left-0 right-0 bg-linear-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
                            <p className="text-sm text-blue-600 font-semibold animate-bounce">
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
                                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {scrolledToBottom ? 'I Agree - Accept Terms' : 'Scroll to Accept'}
                    </button>
                </div>
            </div>
        </div>
    );
}
