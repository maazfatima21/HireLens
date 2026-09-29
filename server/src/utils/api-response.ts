export const successResponse = <T>(
  message: string,
  data: T
) => {
  return {
    success: true,
    message,
    data
  };
};