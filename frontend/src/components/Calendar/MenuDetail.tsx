import { useState, useRef, useEffect } from 'react';
import { MenuDataType } from '../../pages/Calendar/index';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import { showToast } from '../../utils/sweetalert';
import { useAuthStore } from '../../store/authStore';

interface MenuDetailProps {
  selectedDate: string | null;
  menuData: MenuDataType;
  onMenuUpdate?: (date: string, updatedMenu: string[]) => void; // 메뉴 업데이트 콜백 (선택 사항)
}

// 메뉴 업데이트 요청 타입
interface UpdateMenuRequest {
  menu: string;
  date: string;
  alternative_menu: string;
}

interface PopupPosition {
  top: number;
  left: number;
}

const MenuDetail = ({ selectedDate, menuData, onMenuUpdate }: MenuDetailProps) => {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<{ name: string; index: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>({ top: 0, left: 0 });
  const [localMenuData, setLocalMenuData] = useState<MenuDataType>(menuData); // 로컬 상태로 menuData 관리
  const { accessToken } = useAuthStore();
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);

  // menuData가 변경되면 localMenuData도 업데이트
  useEffect(() => {
    setLocalMenuData(menuData);
  }, [menuData]);

  // 메뉴 항목 클릭 시 대체 메뉴 조회
  const handleMenuClick = async (menuName: string, index: number) => {
    if (!selectedDate || !accessToken) return;

    // 클릭한 메뉴 항목의 위치 계산
    const menuElement = menuRefs.current[index];
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      setPopupPosition({
        top: rect.top + window.scrollY - 10, // 메뉴와 같은 높이
        left: rect.left - 210, // 메뉴 왼쪽에 붙이기 (말풍선 너비 + 여백)
      });
    }

    try {
      setLoading(true);
      setSelectedMenu({ name: menuName, index });

      // Authorization 헤더 설정
      const authHeaderValue = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;

      // 메뉴 대체재 API 호출 (GET 요청)
      const url = `${API_CONFIG.ENDPOINTS.MEAL.MENU_ALTERNATIVES}?menu=${encodeURIComponent(
        menuName
      )}&date=${selectedDate}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: authHeaderValue,
          'Content-Type': 'application/json',
        },
      });

      // 대체 메뉴 데이터 설정
      if (response.data && Array.isArray(response.data.alternatives || response.data)) {
        // API 응답 형식에 따라 alternatives 속성 또는 직접 배열이 올 수 있음
        setAlternatives(response.data.alternatives || response.data);
        setShowModal(true);
      } else {
        setAlternatives([]);
        showToast('대체 메뉴가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('대체 메뉴 조회 오류:', error);
      showToast('대체 메뉴를 가져오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 대체 메뉴 선택 시 메뉴 업데이트
  const handleAlternativeSelect = async (alternativeMenu: string) => {
    if (!selectedDate || !selectedMenu || !accessToken) return;

    try {
      setLoading(true);

      // Authorization 헤더 설정
      const authHeaderValue = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;

      // 메뉴 업데이트 API 호출
      const updateRequest: UpdateMenuRequest = {
        date: selectedDate,
        menu: selectedMenu.name,
        alternative_menu: alternativeMenu,
      };

      const response = await axios.patch(API_CONFIG.ENDPOINTS.MEAL.UPDATE_MENU, updateRequest, {
        headers: {
          Authorization: authHeaderValue,
          'Content-Type': 'application/json',
        },
      });

      // 업데이트 성공 시 로컬 menuData 상태 업데이트
      if (response.status === 200) {
        // 로컬 메뉴 데이터 복사
        const updatedMenuData = { ...localMenuData };

        // 해당 날짜의 메뉴 배열 복사
        if (updatedMenuData[selectedDate] && updatedMenuData[selectedDate].menu) {
          const updatedMenu = [...updatedMenuData[selectedDate].menu];

          // 선택한 메뉴 항목을 대체 메뉴로 교체
          updatedMenu[selectedMenu.index] = alternativeMenu;

          // 업데이트된 메뉴 배열 적용
          updatedMenuData[selectedDate].menu = updatedMenu;

          // 로컬 상태 업데이트
          setLocalMenuData(updatedMenuData);

          // 부모 컴포넌트 콜백이 있으면 호출
          if (onMenuUpdate) {
            onMenuUpdate(selectedDate, updatedMenu);
          }
        }

        // 성공 메시지 표시
        showToast('메뉴가 업데이트되었습니다.', 'success');
      } else {
        showToast('메뉴 업데이트에 실패했습니다.', 'error');
      }

      // 모달 닫기
      setShowModal(false);
    } catch (error) {
      console.error('메뉴 업데이트 오류:', error);
      showToast('메뉴 업데이트에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setAlternatives([]);
    setSelectedMenu(null);
  };

  // 클릭 외부 감지 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModal) {
        const target = event.target as HTMLElement;
        const popupElement = document.getElementById('alternatives-popup');

        if (popupElement && !popupElement.contains(target)) {
          closeModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  // 선택된 날짜가 없는 경우
  if (!selectedDate) {
    return (
      <div
        className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
        style={{ width: '350px', flexShrink: 0 }}
      >
        <div className="h-full flex items-center justify-center text-gray-500">
          날짜를 선택하면 식단이 표시됩니다.
        </div>
      </div>
    );
  }

  // 선택된 날짜의 요일 계산
  const date = new Date(selectedDate);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = weekdays[date.getDay()];

  // 날짜 포맷팅 (YYYY-MM-DD → MM월 DD일)
  const formattedDate = selectedDate
    ? `${parseInt(selectedDate.split('-')[1])}월 ${parseInt(selectedDate.split('-')[2])}일`
    : '';

  // 선택된 날짜에 메뉴 데이터가 없는 경우
  const hasNoMenu = !localMenuData[selectedDate] || localMenuData[selectedDate].menu.length === 0;

  return (
    <div
      className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
      style={{ width: '350px', flexShrink: 0 }}
    >
      <div className="flex flex-col h-full">
        <div className="text-base font-semibold text-center mb-3">
          {formattedDate} ({dayOfWeek}) 식단
        </div>
        <div className="flex-grow flex flex-col h-[380px]">
          {!hasNoMenu ? (
            // 메뉴가 있는 경우 메뉴 목록 표시
            <div className="flex-grow flex flex-col gap-1 items-center overflow-y-auto">
              {localMenuData[selectedDate].menu.map((item: string, index: number) => (
                <div
                  key={index}
                  ref={(el) => {
                    menuRefs.current[index] = el;
                  }}
                  className="bg-white/40 w-[95%] px-3 py-3 rounded-xl text-base shadow-sm text-center mb-2 cursor-pointer hover:bg-orange-50 transition-colors relative z-10"
                  onClick={() => handleMenuClick(item, index)}
                >
                  <div className="truncate">{item}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-400 mb-6">메뉴 정보가 없습니다.</div>
            </div>
          )}
        </div>
      </div>

      {/* 대체 메뉴 말풍선 팝업 */}
      {showModal && selectedMenu && (
        <div
          id="alternatives-popup"
          className="fixed z-50"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            width: '200px', // 고정 너비
            height: 'auto',
          }}
        >
          <div className="bg-white/90 rounded-xl p-3 shadow-lg relative">
            {/* 말풍선 화살표 - 오른쪽으로 방향 변경 */}
            <div
              className="absolute w-3 h-3 bg-white/90 transform rotate-45"
              style={{
                top: '30px',
                right: '-6px',
              }}
            ></div>

            <div className="text-sm font-bold mb-2 text-center text-orange-500">
              이런메뉴는 어때요?
            </div>

            {loading ? (
              <div className="text-center py-2 text-xs">로딩 중...</div>
            ) : (
              <div
                className="overflow-y-auto mb-2"
                style={{ maxHeight: '180px', minHeight: '50px' }}
              >
                {alternatives.length > 0 ? (
                  <div className="grid gap-1">
                    {alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-100 hover:bg-orange-100 p-2 rounded-lg cursor-pointer transition-colors text-xs text-center"
                        onClick={() => handleAlternativeSelect(alt)}
                      >
                        {alt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-xs">
                    대체 가능한 메뉴가 없습니다.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <button
                className="bg-transparent hover:bg-red-400 px-3 py-1 rounded-lg transition-colors text-xs"
                onClick={closeModal}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuDetail;
