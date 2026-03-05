"use client"

import Swal, { type SweetAlertIcon } from "sweetalert2"

type AlertOptions = {
  title: string
  text: string
  icon: SweetAlertIcon
}

const baseSwal = Swal.mixin({
  customClass: {
    popup: "swal-glass-popup",
    title: "swal-glass-title",
    htmlContainer: "swal-glass-text",
    confirmButton: "swal-glass-confirm",
    cancelButton: "swal-glass-cancel",
    actions: "swal-glass-actions",
    closeButton: "swal-glass-close",
  },
  buttonsStyling: false,
  width: "19rem",
  padding: "0.35rem 0.65rem 0.45rem",
  showCloseButton: true,
  timer: 3000,
  timerProgressBar: true,
  confirmButtonText: "Okay",
})

export function showGlassAlert(options: AlertOptions) {
  return baseSwal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon,
  })
}

export function showSuccessAlert() {
  return showGlassAlert({
    title: "Success",
    text: "Your action completed successfully.",
    icon: "success",
  })
}

export function showInfoAlert() {
  return showGlassAlert({
    title: "Info",
    text: "Here is some useful information for this action.",
    icon: "info",
  })
}

export function showErrorAlert() {
  return showGlassAlert({
    title: "Error",
    text: "Something went wrong. Please try again.",
    icon: "error",
  })
}

export function showWarningAlert() {
  return showGlassAlert({
    title: "Warning",
    text: "Please review this action before proceeding.",
    icon: "warning",
  })
}

export async function showQuestionAlert() {
  const result = await baseSwal.fire({
    title: "Are you sure?",
    text: "Do you want to continue with this action?",
    icon: "question",
    timer: undefined,
    timerProgressBar: false,
    showCancelButton: true,
    confirmButtonText: "Yes, continue",
    cancelButtonText: "Cancel",
  })

  if (result.isConfirmed) {
    return showGlassAlert({
      title: "Confirmed",
      text: "Action has been confirmed.",
      icon: "success",
    })
  }

  return null
}
