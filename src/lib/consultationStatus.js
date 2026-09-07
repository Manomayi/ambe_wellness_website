/**
 * Utility to classify consultation status for Web portal.
 * Handles Completed, Cancelled by User, Cancelled by Doctor, Missed (No-Show), and Doctor Absent.
 */

export function getConsultationStatusInfo(appointment) {
  if (!appointment) {
    return {
      statusKey: 'unknown',
      label: 'Unknown',
      badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
      dotClass: 'bg-gray-400',
      isCancelled: false,
      isMissed: false,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  const rawStatus = (appointment.status || '').toString().toLowerCase().trim();
  const userJoined = appointment.user_joined === true;
  const doctorJoined = appointment.doctor_joined === true;

  const recommendations = appointment.recommendations || null;
  const storeRecommendations =
    appointment.store_recommendations || appointment.storeRecommendations || [];
  const notes = appointment.notes || '';
  const referral = appointment.referral || null;

  const hasReport =
    (recommendations && Object.keys(recommendations).length > 0) ||
    (Array.isArray(storeRecommendations) && storeRecommendations.length > 0) ||
    Boolean(notes && notes.trim().length > 0) ||
    Boolean(referral);

  // 1. Cancelled Scenarios
  if (rawStatus.includes('cancel')) {
    if (
      rawStatus.includes('doctor') ||
      rawStatus.includes('admin') ||
      rawStatus === 'cancelled_doctor_deleted'
    ) {
      return {
        statusKey: 'cancelled_by_doctor',
        label: 'Cancelled by Doctor',
        badgeClass: 'bg-stone-100 text-stone-700 border border-stone-300',
        dotClass: 'bg-stone-500',
        isCancelled: true,
        isMissed: false,
        isCompleted: false,
        hasReport: false,
        actionText: 'View Details',
      };
    }

    return {
      statusKey: 'cancelled_by_user',
      label: 'Cancelled by You',
      badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      dotClass: 'bg-red-500',
      isCancelled: true,
      isMissed: false,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  // 2. Missed / No-Show Scenarios
  if (
    rawStatus.includes('missed') ||
    rawStatus === 'no_show' ||
    rawStatus.includes('no-show')
  ) {
    if (rawStatus.includes('doctor')) {
      return {
        statusKey: 'doctor_absent',
        label: 'Doctor Absent',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
        dotClass: 'bg-amber-500',
        isCancelled: false,
        isMissed: true,
        isCompleted: false,
        hasReport: false,
        actionText: 'View Details',
      };
    }

    return {
      statusKey: 'missed',
      label: 'Missed',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500',
      isCancelled: false,
      isMissed: true,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  // Check attendance explicitly if status is not cancelled or explicit missed
  if (!userJoined && doctorJoined) {
    return {
      statusKey: 'missed',
      label: 'Missed',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500',
      isCancelled: false,
      isMissed: true,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  if (userJoined && !doctorJoined) {
    return {
      statusKey: 'doctor_absent',
      label: 'Doctor Absent',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500',
      isCancelled: false,
      isMissed: true,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  // Neither joined and no report written -> Missed
  if (!userJoined && !doctorJoined && !hasReport && rawStatus !== 'completed') {
    return {
      statusKey: 'missed',
      label: 'Missed',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500',
      isCancelled: false,
      isMissed: true,
      isCompleted: false,
      hasReport: false,
      actionText: 'View Details',
    };
  }

  // 3. Completed Consultation
  return {
    statusKey: 'completed',
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotClass: 'bg-emerald-500',
    isCancelled: false,
    isMissed: false,
    isCompleted: true,
    hasReport: hasReport,
    actionText: hasReport ? 'View Report' : 'Report Pending',
  };
}
