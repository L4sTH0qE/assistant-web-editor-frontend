import React from 'react';
import {Avatar, Dropdown, Layout, Menu, Typography} from 'antd';
import {AppstoreOutlined, LogoutOutlined, UserOutlined} from '@ant-design/icons';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {logout} from '../../store/authSlice';

const {Header, Sider, Content} = Layout;
const {Text} = Typography;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const userMenu = {
        items: [{key: '1', label: 'Выйти', icon: <LogoutOutlined/>, onClick: handleLogout}],
    };

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Header style={{
                color: 'var(--hse-green-accent)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text strong style={{color: 'white', fontSize: '18px'}}>
                    Помощник редактора
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
                        style={{height: '100%', borderRight: 0}}
                        items={[
                            {key: '/', icon: <AppstoreOutlined/>, label: 'Каталог страниц'},
                        ]}
                        onClick={({key}) => navigate(key)}
                    />
                </Sider>
                <Layout style={{padding: '24px'}}>
                    <Content style={{background: '#fff', padding: 24, margin: 0, minHeight: 280, borderRadius: '4px'}}>
                        <Outlet/>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MainLayout;