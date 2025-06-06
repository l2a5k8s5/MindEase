import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import toastOptions from "../../constants/toast";
import { getUserChat } from "../../redux/Actions/chatAction";
import { useSocket } from "../../context/SocketContext";
import {
	deleteRequest,
	getRequestByUserId,
	updateRequest,
} from "../../redux/Actions/chatRequestAction";
import { createReview } from "../../redux/Actions/reviewAction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as solidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import { Pencil, Trash, X } from "lucide-react";
import React, { useEffect, useState } from "react";

const CounselorRequests = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { socket } = useSocket();
	const [activeTab, setActiveTab] = useState("requests");
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState(null);
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [selectedChat, setSelectedChat] = useState(null);
	const [rating, setRating] = useState(0);
	const [hover, setHover] = useState(0);
	const [review, setReview] = useState("");
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [editedRequest, setEditedRequest] = useState({});

	const { loading, requestByUser, error, message } = useSelector(
		(state) => state.chatRequest
	);
	const { userChats } = useSelector((state) => state.chat);
	const { user } = useSelector((state) => state.user);

	// Initial data fetch
	useEffect(() => {
		if (user && user._id) {
			dispatch(getRequestByUserId(user._id));
		}
		dispatch(getUserChat());
	}, [dispatch, user]);

	// Socket event listeners
	useEffect(() => {
		if (socket && user?._id) {
			// Listen for request acceptance
			socket.on("request_accepted", ({ userId, requestId, chatId }) => {
				if (userId === user._id) {
					// Update both request list and chat list
					dispatch(getRequestByUserId(user._id));
					dispatch(getUserChat());

					// Show success notification
					toast.success("A volunteer has accepted your request!", toastOptions);
				}
			});

			// Listen for new chat messages
			socket.on("receive_message", () => {
				dispatch(getUserChat());
			});

			return () => {
				socket.off("request_accepted");
				socket.off("receive_message");
			};
		}
	}, [socket, user, dispatch]);

	// Error and message handlers
	useEffect(() => {
		if (error) {
			toast.error(error, toastOptions);
			dispatch({ type: "CLEAR_ERROR" });
		}
		if (message) {
			toast.success(message, toastOptions);
			dispatch({ type: "CLEAR_MESSAGE" });
		}
	}, [error, message, dispatch]);

	const handleStartChat = (chatId) => {
		navigate(`/counselor-chat/${chatId}`);
	};

	const openEditModal = (request) => {
		setSelectedRequest(request);
		setEditedRequest(request);
		setEditModalOpen(true);
	};

	const closeEditModal = () => {
		setEditModalOpen(false);
		setSelectedRequest(null);
		setEditedRequest({});
	};

	const handleSubmitEdit = async (e) => {
		e.preventDefault();
		try {
			await dispatch(updateRequest(selectedRequest._id, editedRequest));
			await dispatch(getRequestByUserId(user._id)); // 👈 Fetch updated data
			closeEditModal();
		} catch (error) {
			console.error("Failed to update request:", error);
		}
	};




	const handleEditChange = (e) => {
		const { name, value } = e.target;
		setEditedRequest((prev) => ({ ...prev, [name]: value }));
	};

	const openDeleteModal = (id) => {
		setSelectedRequestId(id);
		setDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		await dispatch(deleteRequest(selectedRequestId));
		await dispatch(getRequestByUserId(user._id)); 
		setDeleteModalOpen(false);
		setSelectedRequestId(null);
	};

	const cancelDelete = () => {
		setDeleteModalOpen(false);
		setSelectedRequestId(null);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const handleOpenReviewModal = (chat, e) => {
		e.stopPropagation(); // Prevent chat opening when clicking review button
		setSelectedChat(chat);
		setReviewModalOpen(true);
	};

	const handleSubmitReview = (e) => {
		e.preventDefault();
		if (rating === 0) {
			toast.error("Please select a rating", toastOptions);
			return;
		}
		if (!selectedChat?.volunteerId?._id) {
			toast.error("Volunteer information not found", toastOptions);
			return;
		}
		dispatch(
			createReview(selectedChat.volunteerId._id, {
				rating,
				review,
			})
		);
		setReviewModalOpen(false);
		setRating(0);
		setReview("");
		setSelectedChat(null);
	};

	return (
		<div className="min-h-screen flex flex-col bg-orange-50 pt-20">
			<nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
				<div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-20 w-full">
						<Header />
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8 flex-1">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-semibold text-gray-800 mb-6">
						Counseling Requests
					</h2>

					{/* Tabs */}
					<div className="flex border-b border-gray-200 mb-6">
						<button
							onClick={() => setActiveTab("requests")}
							className={`py-2 px-4 ${
								activeTab === "requests"
									? "border-b-2 border-orange-500 text-orange-600"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Requests
						</button>
						<button
							onClick={() => setActiveTab("chats")}
							className={`py-2 px-4 ${
								activeTab === "chats"
									? "border-b-2 border-orange-500 text-orange-600"
									: "text-gray-500 hover:text-gray-700"
							}`}
						>
							Active Chats
						</button>
					</div>

					{/* Content based on active tab */}
					{activeTab === "requests" && (
						<div>
							{requestByUser && requestByUser.length > 0 ? (
								<div className="space-y-4">
									{[...requestByUser].reverse().map((request) => (
										<div
											key={request._id}
											className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
										>
											<div className="flex justify-between items-start mb-2">
												<div>
													<h3 className="text-lg font-medium text-gray-800">
														{request.Topic}
													</h3>
												</div>
												<div className="flex items-center gap-3">
													<span
														className={`px-2 py-1 text-xs rounded-full ${
															request.status === "pending"
																? "bg-yellow-100 text-yellow-800"
																: "bg-green-100 text-green-800"
														}`}
													>
														{request.status.charAt(0).toUpperCase() +
															request.status.slice(1)}
													</span>
													<button
														className="text-gray-500 hover:text-orange-600"
														onClick={() => openEditModal(request)}
													>
														<Pencil size={18} />
													</button>
													<button
														className="text-gray-500 hover:text-red-600"
														onClick={() => openDeleteModal(request._id)}
													>
														<Trash size={18} />
													</button>
												</div>
											</div>
											<p className="text-gray-600 mb-3">
												{request?.description}
											</p>
											<div className="text-sm text-gray-500">
												<span>Category: {request.category}</span>
												<span className="mx-2">•</span>
												<span>Submitted: {formatDate(request.createdAt)}</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<p className="text-gray-500 mb-4">
										You don't have any active requests.
									</p>
									<button
										onClick={() => navigate("/counselling")}
										className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
									>
										Create New Request
									</button>
								</div>
							)}
						</div>
					)}

					{activeTab === "chats" && (
						<div>
							{userChats && userChats?.length > 0 ? (
								<div className="space-y-4">
									{userChats.map((chat) => (
										<div
											key={chat._id}
											className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
										>
											<div className="flex justify-between items-start mb-2">
												<div
													className="flex-1"
													onClick={() => handleStartChat(chat._id)}
												>
													<h3 className="text-lg font-medium text-gray-800">
														{chat?.topic}
													</h3>
												</div>
												<div className="flex items-center gap-3">
													{chat.unread > 0 && (
														<span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
															{chat.unread} new
														</span>
													)}
													<button
														onClick={(e) => handleOpenReviewModal(chat, e)}
														className="px-3 py-1 text-sm bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
													>
														Review
													</button>
												</div>
											</div>
											<div
												className="cursor-pointer"
												onClick={() => handleStartChat(chat._id)}
											>
												<p className="text-gray-600 mb-3">
													<span className="font-medium">
														{chat?.volunteerId?.firstName}{" "}
														{chat?.volunteerId?.lastName}
													</span>{" "}
													{chat.lastMessage}
												</p>
												<div className="text-sm text-gray-500">
													Last updated: {formatDate(chat.updatedAt)}
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<p className="text-gray-500 mb-4">
										You don't have any active chats.
									</p>
									<button
										onClick={() => navigate("/counselling")}
										className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
									>
										Request Counseling
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</main>

			{/* Delete Confirmation Modal */}
			{deleteModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
					<div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Delete Request
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete this request?
						</p>
						<div className="flex justify-end space-x-3">
							<button
								onClick={cancelDelete}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Review Modal */}
			{reviewModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
					<div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800">
								Review Volunteer
							</h3>
							<button
								onClick={() => {
									setReviewModalOpen(false);
									setRating(0);
									setReview("");
									setSelectedChat(null);
								}}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmitReview} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Rate your experience with{" "}
									{selectedChat?.volunteerId?.firstName}
								</label>
								<div className="flex space-x-1">
									{[...Array(5)].map((_, index) => {
										const ratingValue = index + 1;
										return (
										<button
											type="button"
												key={ratingValue}
												className={`focus:outline-none text-2xl ${
													(hover || rating) >= ratingValue
														? "text-yellow-400"
														: "text-gray-300"
												}`}
												onClick={() => setRating(ratingValue)}
												onMouseEnter={() => setHover(ratingValue)}
												onMouseLeave={() => setHover(0)}
											>
												<FontAwesomeIcon
													icon={
														(hover || rating) >= ratingValue
															? solidStar
															: regularStar
												}
											/>
										</button>
										);
									})}
								</div>
							</div>

							<div>
								<label
									htmlFor="review"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Your Review
								</label>
								<textarea
									id="review"
									value={review}
									onChange={(e) => setReview(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
									rows="4"
									placeholder="Share your experience..."
									required
								></textarea>
							</div>

							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => {
										setReviewModalOpen(false);
										setRating(0);
										setReview("");
										setSelectedChat(null);
									}}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
								>
									Submit Review
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Modal */}
			{editModalOpen && selectedRequest && (
				<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
					<div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-800">
								Edit Request
							</h3>
							<button
								onClick={closeEditModal}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmitEdit}>
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-gray-700 mb-2 block">
										Topic
									</label>
									<input
										type="text"
										name="Topic"
										value={editedRequest.Topic}
										onChange={handleEditChange}
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 mb-2 block">
										Description
									</label>
									<textarea
										name="description"
										value={editedRequest.description}
										onChange={handleEditChange}
										rows="4"
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
									></textarea>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 mb-2 block">
										Category
									</label>
									<input
										type="text"
										name="category"
										value={editedRequest.category}
										onChange={handleEditChange}
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
									/>
								</div>

								<div className="flex justify-end space-x-3 pt-4">
									<button
										type="button"
										onClick={closeEditModal}
										className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
									>
										Save Changes
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default CounselorRequests;
