/**
 * @param none
 * @return { promise } 카테고리, 사용자 권한 등..
 * -------------------------------------------------------------------
 * @description
 */
export async function getSystemAll() {
  try {
    return await api.get('/system/getSystemAll');
  } catch (err) {
    console.log(err);
  }
}
