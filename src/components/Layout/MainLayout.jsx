import React, {useState} from 'react';
import {Avatar, Dropdown, Layout, Menu, Typography} from 'antd';
import {
    AppstoreOutlined,
    BarChartOutlined,
    BookOutlined,
    LogoutOutlined,
    TagsOutlined,
    UserOutlined
} from '@ant-design/icons';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {logout} from '../../store/authSlice';

import {GlossaryModal} from '../Glossary/GlossaryModal';
import {TaxonomyModal} from '../Taxonomy/TaxonomyModal';

const {Header, Sider, Content} = Layout;
const {Text} = Typography;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
    const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const userMenu = {
        items: [{key: '1', label: 'Выйти', icon: <LogoutOutlined/>, onClick: handleLogout}],
    };

    const handleMenuClick = ({key}) => {
        if (key === '/glossary') {
            setIsGlossaryOpen(true);
        } else if (key === '/taxonomy') {
            setIsTaxonomyOpen(true);
        } else {
            navigate(key);
        }
    };

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text strong style={{color: 'white', fontSize: '18px'}}>
                    Помощник редакторов сайтов подразделений НИУ ВШЭ
                </Text>
                <div>
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <Text style={{color: 'white'}}>{user?.fullName || 'Пользователь'}</Text>
                            <Avatar style={{backgroundColor: 'white'}} icon={<UserOutlined style={{color: 'black'}}/>}/>
                        </div>
                    </Dropdown>
                </div>
            </Header>
            <Layout>
                <Sider width={250} theme="light">
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname + location.search]}
                        style={{height: '100%', borderRight: 0, padding: '2px'}}
                        items={[
                            {key: '/', icon: <AppstoreOutlined/>, label: 'Каталог страниц',},
                            {key: '/analytics', icon: <BarChartOutlined/>, label: 'Аналитика'},
                            {key: '/glossary', icon: <BookOutlined/>, label: 'Словарь ссылок'},
                            {key: '/taxonomy', icon: <TagsOutlined/>, label: 'Справочник метаданных'},
                        ]}
                        onClick={handleMenuClick}
                    />
                </Sider>
                <Layout style={{padding: '24px'}}>
                    <Content style={{background: '#fff', minHeight: 280, borderRadius: '4px'}}>
                        <Outlet/>
                    </Content>
                </Layout>
            </Layout>
            <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)}/>
            <TaxonomyModal isOpen={isTaxonomyOpen} onClose={() => setIsTaxonomyOpen(false)}/>
        </Layout>
    );
};

export default MainLayout;