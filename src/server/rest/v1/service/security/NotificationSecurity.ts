import { HttpEndUserReportErrorRequest, HttpNotificationRequest } from '../../../../../types/requests/HttpNotificationRequest';

import Authorizations from '../../../../../authorization/Authorizations';
import { DataResult } from '../../../../../types/DataResult';
import { Notification } from '../../../../../types/UserNotifications';
import UserSecurity from './UserSecurity';
import UserToken from '../../../../../types/UserToken';
import UtilsSecurity from './UtilsSecurity';
import sanitize from 'mongo-sanitize';

export default class NotificationSecurity {
  static filterNotificationsRequest(request: any): HttpNotificationRequest {
    const filteredRequest: HttpNotificationRequest = {} as HttpNotificationRequest;
    filteredRequest.UserID = sanitize(request.UserID);
    filteredRequest.DateFrom = sanitize(request.DateFrom);
    filteredRequest.Channel = sanitize(request.Channel);
    UtilsSecurity.filterSkipAndLimit(request, filteredRequest);
    UtilsSecurity.filterSort(request, filteredRequest);
    return filteredRequest;
  }

  static filterEndUserReportErrorRequest(request: any): HttpEndUserReportErrorRequest {
    const filteredRequest: HttpEndUserReportErrorRequest = {
      subject:  sanitize(request.subject),
      description: sanitize(request.description),
      mobile: sanitize(request.mobile),
    };
    return filteredRequest;
  }

  static filterNotificationsResponse(notifications: DataResult<Notification>, loggedUser: UserToken): void {
    const filteredNotifications = [];

    if (!notifications.result) {
      return null;
    }
    for (const notification of notifications.result) {
      // Filter
      const filteredNotification = NotificationSecurity.filterNotificationResponse(notification, loggedUser);
      // Ok?
      if (filteredNotification) {
        // Add
        filteredNotifications.push(filteredNotification);
      }
    }
    notifications.result = filteredNotifications;
  }

  // Notification
  static filterNotificationResponse(notification: Notification, loggedUser: UserToken): Notification {
    let filteredNotification = null;

    if (!notification) {
      return null;
    }
    // Check auth
    if (!notification.userID || Authorizations.canReadUser(loggedUser, notification.userID)) {
      // No user provided and you are not admin?
      if (!notification.userID && !Authorizations.isAdmin(loggedUser)) {
        // Yes: do not send this notif
        return null;
      }
      filteredNotification = {};
      // Set only necessary info
      filteredNotification.id = notification.id;
      filteredNotification.timestamp = notification.timestamp;
      filteredNotification.channel = notification.channel;
      filteredNotification.sourceId = notification.sourceId;
      filteredNotification.sourceDescr = notification.sourceDescr;
      filteredNotification.userID = notification.userID;
      filteredNotification.chargeBoxID = notification.chargeBoxID;
      filteredNotification.data = notification.data;
      // Handle users
      if (notification.user) {
        filteredNotification.user = UserSecurity.filterMinimalUserResponse(notification.user, loggedUser);
      }
    }
    return filteredNotification;
  }
}

