import mongoose from "mongoose";
import ChatRequest from "../models/chatRequest.js";
import User from "../models/user.js";
import { message } from "../utils/message.js";
import { Response } from "../utils/response.js";

export const createRequest = async (req, res) => {
	try {
		const { category, Topic, description } = req.body;
		if (!category || !Topic || !description) {
			return Response(res, 400, false, message.missingFieldMessage);
		}
		const { id } = req.user;
		const newRequest = await ChatRequest.create({
			userId: id,
			category,
			Topic,
			description,
			status: "pending",
		});
		req.user.chatRequests.push(newRequest._id);
		await req.user.save();
		return Response(res, 201, true, message.createRequestMessage, newRequest);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const getAllRequests = async (req, res) => {
	try {
		const requests = await ChatRequest.find().populate("userId", "firstName lastName email");
		return Response(res, 200, true, message.getAllRequestsMessage, requests);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const getRequestByUserId = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || !mongoose.Types.ObjectId.isValid(id)) {
			return Response(res, 400, false, message.invalidId);
		}
		const requests = await ChatRequest.find({ userId: id }).populate("userId", "firstName lastName email");
		if (!requests || requests.length === 0) {
			return Response(res, 404, false, message.requestNotFound);
		}
		return Response(res, 200, true, message.getRequestMessage, requests);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const updateRequest = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || !mongoose.Types.ObjectId.isValid(id)) {
			return Response(res, 400, false, message.invalidId);
		}
		const updatedRequest = await ChatRequest.findByIdAndUpdate(id, req.body, { new: true });
		if (!updatedRequest) {
			return Response(res, 404, false, message.requestNotFound);
		}
		return Response(res, 200, true, message.updateRequestMessage, updatedRequest);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const getRequestByCategory = async (req, res) => {
	try {
		const { category } = req.params;
		if (!category) {
			return Response(res, 400, false, message.invalidCategory);
		}
		const requests = await ChatRequest.find({ category }).populate("userId", "firstName lastName email");
		if (!requests || requests.length === 0) {
			return Response(res, 404, false, message.requestNotFound);
		}
		return Response(res, 200, true, message.getRequestMessage, requests);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const getRequestById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || !mongoose.Types.ObjectId.isValid(id)) {
			return Response(res, 400, false, message.invalidId);
		}
		const request = await ChatRequest.findById(id).populate("userId", "firstName lastName email");
		if (!request) {
			return Response(res, 404, false, message.requestNotFound);
		}
		return Response(res, 200, true, message.getRequestByIdMessage, request);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const AcceptRequest = async (req, res) => {
	try {
		const { id } = req.params;
		// if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		// 	return Response(res, 400, false, message.invalidId);
		// }
		const request = await ChatRequest.findByIdAndUpdate(id, { status: "accepted" }, { new: true });
		if (!request) {
			return Response(res, 404, false, message.requestNotFound);
		}
		const user = await User.findById(request.userId);
		if (!user) {
			return Response(res, 404, false, message.userNotFound);
		}
		user.volunteerFriends.push(req.volunteer._id);
		await user.save();

		req.volunteer.volunteerFriends.push(request.userId);
		await req.volunteer.save();

		return Response(res, 200, true, message.requestAcceptMessage, request);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const deleteRequest = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || !mongoose.Types.ObjectId.isValid(id)) {
			return Response(res, 400, false, message.invalidId);
		}
		const request = await ChatRequest.findById(id);
		if (!request) {
			return Response(res, 404, false, message.requestNotFound);
		}
		if (request.status === "pending") {
			await request.deleteOne();
			return Response(res, 200, true, message.requestDeleteMessage);
		} else {
			return Response(res, 400, false, "Only pending requests can be deleted");
		}
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};

export const getRequestByVolunteerCategory = async (req, res) => {
	try {
		const volunteer = req.volunteer;
		if (!volunteer || !volunteer.expertiseArea) {
			return Response(res, 400, false, "Volunteer expertise areas not found");
		}
		const requests = await ChatRequest.find({
			category: { $in: volunteer.expertiseArea },
			status: "pending",
		}).populate("userId", "firstName lastName email");
        console.log(requests);
		if (!requests || requests.length === 0) {
			return Response(res, 404, false, "No matching requests found");
		}
		return Response(res, 200, true, "Matching requests found", requests);
	} catch (error) {
		return Response(res, 500, false, error.message);
	}
};
